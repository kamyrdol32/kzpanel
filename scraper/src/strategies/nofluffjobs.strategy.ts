import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API = 'https://nofluffjobs.com/api';
const JOB_URL = (id: string): string => `https://nofluffjobs.com/pl/job/${id}`;
const UA = 'Mozilla/5.0 (compatible; EvPanel-Scraper/1.0)';

/**
 * NoFluffJobs strategy — mirrors the portal's own technology search.
 *
 * The site's /pl/{tech} pages (e.g. /pl/Angular) post to the infinite-scroll
 * search endpoint with the criterion `requirement = [tech]` and the content
 * type `application/infiniteSearch+json`. With that content type the `pageTo`
 * query param actually paginates (with plain application/json it is ignored
 * and the server keeps returning the first page).
 *
 *   list:    POST /api/search/posting  (Content-Type infiniteSearch+json)
 *            body { criteriaSearch: { requirement: [query] } }
 *   details: GET  /api/posting/{id}
 *
 * For queries that are not a known requirement tag we fall back to free-text
 * `rawSearch` and filter the results locally.
 */
@Injectable()
export class NoFluffJobsStrategy implements JobScraperStrategy {
  readonly source = JobSource.NOFLUFFJOBS;
  private readonly logger = new Logger(NoFluffJobsStrategy.name);

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();

    try {
      let postings = query
        ? await this.fetchByRequirement(query)
        : await this.fetchPages({ rawSearch: '' });

      if (query && postings.length === 0) {
        this.logger.log(`"${query}" — no requirement match, falling back to rawSearch`);
        const raw = await this.fetchPages({ rawSearch: query });
        const q = query.toLowerCase();
        postings = raw.filter((p) => this.matchesQuery(p, q));
      }

      if (params.remoteType === RemoteType.REMOTE) {
        postings = postings.filter(
          (p) =>
            p.fullyRemote ||
            p.location?.places?.some((pl) => pl.city?.toLowerCase() === 'remote'),
        );
      }

      this.logger.log(`"${query}" → ${postings.length} postings (remote=${params.remoteType === RemoteType.REMOTE})`);

      return postings
        .filter((p) => p?.id)
        .map((p) => ({
          externalId: p.id,
          title: p.title ?? 'Untitled',
          company: p.name ?? 'Unknown',
          sourceUrl: JOB_URL(p.id),
          meta: p,
        }));
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
      return [];
    }
  }

  private fetchByRequirement(query: string): Promise<NfjPosting[]> {
    return this.fetchPages({ rawSearch: '', criteriaSearch: { requirement: [query] } });
  }

  /**
   * Paginate the infinite-scroll search until a page comes back empty or
   * adds no new offers. Deduplicates by id (the API may repeat offers across
   * adjacent pages).
   */
  private async fetchPages(body: NfjSearchBody): Promise<NfjPosting[]> {
    const byId = new Map<string, NfjPosting>();
    const maxPages = 50;
    let totalCount: number | null = null;

    for (let pageTo = 1; pageTo <= maxPages; pageTo++) {
      const url = `${API}/search/posting?pageTo=${pageTo}&pageSize=100&salaryCurrency=PLN&salaryPeriod=month&region=pl`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/infiniteSearch+json', 'User-Agent': UA },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        this.logger.warn(`pageTo ${pageTo} returned HTTP ${res.status}`);
        break;
      }
      const data = (await res.json()) as { postings?: NfjPosting[]; totalCount?: number };
      const batch = data.postings ?? [];

      if (pageTo === 1) {
        totalCount = data.totalCount ?? null;
        this.logger.log(`NFJ search — ${totalCount ?? '?'} total reported`);
      }

      if (batch.length === 0) {
        break;
      }

      const before = byId.size;
      for (const p of batch) {
        if (p?.id) {
          byId.set(p.id, p);
        }
      }
      if (byId.size === before) {
        break;
      }
    }

    return [...byId.values()];
  }

  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const listing = stub.meta as NfjPosting | undefined;
    const base = this.fromListing(stub, listing);

    try {
      const res = await fetch(`${API}/posting/${stub.externalId}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return base;
      const d = (await res.json()) as NfjDetail;

      const musts = (d.requirements?.musts ?? []).map((m) => m.value).filter(Boolean);
      const nices = (d.requirements?.nices ?? []).map((m) => m.value).filter(Boolean);
      const responsibilities = (d.specs?.dailyTasks ?? []).filter((t) => typeof t === 'string');
      const benefits = d.benefits?.benefits ?? [];
      const techStack = musts.length ? musts : base.techStack;
      const description = responsibilities[0] ?? base.description ?? null;

      return {
        ...base,
        description,
        techStack,
        requirements: musts,
        mustHave: musts,
        niceToHave: nices,
        benefits,
        responsibilities,
        language: this.detectLanguage(`${stub.title} ${musts.join(' ')} ${responsibilities.join(' ')}`),
      };
    } catch (err) {
      this.logger.debug(`fetchDetails fallback for ${stub.externalId}: ${(err as Error).message}`);
      return base;
    }
  }

  /** Build a JobRaw from the rich listing row alone (works even if detail fails). */
  private fromListing(stub: JobStub, p?: NfjPosting): JobRaw {
    const city =
      p?.location?.places?.find((pl) => pl.city && pl.city.toLowerCase() !== 'remote')?.city ??
      (p?.fullyRemote ? 'Remote' : null);

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: p?.salary?.from ?? null,
      salaryMax: p?.salary?.to ?? null,
      currency: p?.salary?.currency ?? null,
      location: city,
      remoteType: p?.fullyRemote ? RemoteType.REMOTE : RemoteType.HYBRID,
      level: this.mapSeniority(p?.seniority?.[0]),
      techStack: p?.technology ? [p.technology] : [],
      language: this.detectLanguage(stub.title),
    };
  }

  private mapSeniority(s?: string): JobLevel {
    switch ((s ?? '').toLowerCase()) {
      case 'trainee':
      case 'intern':
        return JobLevel.INTERN;
      case 'junior':
        return JobLevel.JUNIOR;
      case 'senior':
        return JobLevel.SENIOR;
      case 'expert':
      case 'lead':
        return JobLevel.LEAD;
      default:
        return JobLevel.MID;
    }
  }

  private detectLanguage(text: string): Language {
    return /[ąćęłńóśźż]/i.test(text) ? Language.PL : Language.EN;
  }

  /**
   * Mirrors the NFJ site search: an offer matches the query if the keyword
   * appears in its primary technology, its title, or any of its tiles
   * (category/requirement tags). This keeps fullstack roles where the keyword
   * is a real requirement but not the primary tag (e.g. Java + Angular).
   */
  private matchesQuery(p: NfjPosting, q: string): boolean {
    if (p.technology?.toLowerCase().includes(q)) {
      return true;
    }
    if ((p.title ?? '').toLowerCase().includes(q)) {
      return true;
    }
    return (p.tiles?.values ?? []).some((v) => (v.value ?? '').toLowerCase().includes(q));
  }
}

// ── Loose shapes for the public API (only fields we read) ──────
interface NfjSearchBody {
  rawSearch: string;
  criteriaSearch?: { requirement?: string[] };
}
interface NfjPosting {
  id: string;
  name?: string;
  title?: string;
  technology?: string;
  seniority?: string[];
  fullyRemote?: boolean;
  location?: { places?: { city?: string }[] };
  salary?: { from?: number; to?: number; currency?: string };
  tiles?: { values?: { value?: string; type?: string }[] };
}
interface NfjDetail {
  requirements?: { musts?: { value: string }[]; nices?: { value: string }[] };
  specs?: { dailyTasks?: string[] };
  benefits?: { benefits?: string[] };
}
