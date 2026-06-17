import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API = 'https://nofluffjobs.com/api';
const JOB_URL = (id: string): string => `https://nofluffjobs.com/pl/job/${id}`;
const UA = 'Mozilla/5.0 (compatible; EvPanel-Scraper/1.0)';

/**
 * NoFluffJobs strategy — uses the portal's public JSON API (verified shape):
 *   list:    POST /api/search/posting  body { rawSearch }
 *   details: GET  /api/posting/{id}
 * Maps salary/seniority/remote/tech/requirements/benefits into the JobOffer model.
 * Reference URL this mirrors:
 *   https://nofluffjobs.com/pl/praca-zdalna/Angular?criteria=seniority=junior,mid
 */
@Injectable()
export class NoFluffJobsStrategy implements JobScraperStrategy {
  readonly source = JobSource.NOFLUFFJOBS;
  private readonly logger = new Logger(NoFluffJobsStrategy.name);

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const pageSize = Math.min(params.limit ?? 20, 50);
    const url = `${API}/search/posting?pageTo=1&pageSize=${pageSize}&salaryCurrency=PLN&salaryPeriod=month&region=pl`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
        body: JSON.stringify({ rawSearch: params.query ?? '' }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        this.logger.warn(`search returned HTTP ${res.status}`);
        return [];
      }
      const data = (await res.json()) as { postings?: NfjPosting[]; totalCount?: number };
      let postings = data.postings ?? [];

      // Client-side filter for "remote only" (mirrors the site's "praca-zdalna").
      // NoFluffJobs rarely sets fullyRemote, so also accept a "Remote" place.
      if (params.remoteType === RemoteType.REMOTE) {
        postings = postings.filter(
          (p) =>
            p.fullyRemote ||
            p.location?.places?.some((pl) => pl.city?.toLowerCase() === 'remote'),
        );
      }

      this.logger.log(
        `"${params.query ?? ''}" → ${postings.length}/${data.totalCount ?? '?'} postings (remote=${params.remoteType === RemoteType.REMOTE})`,
      );

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
}

// ── Loose shapes for the public API (only fields we read) ──────
interface NfjPosting {
  id: string;
  name?: string;
  title?: string;
  technology?: string;
  seniority?: string[];
  fullyRemote?: boolean;
  location?: { places?: { city?: string }[] };
  salary?: { from?: number; to?: number; currency?: string };
}
interface NfjDetail {
  requirements?: { musts?: { value: string }[]; nices?: { value: string }[] };
  specs?: { dailyTasks?: string[] };
  benefits?: { benefits?: string[] };
}
