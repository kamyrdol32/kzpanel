import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const SEARCH_BASE = (query: string, location?: string): string => {
  let url = `https://bulldogjob.pl/companies/jobs/s/skills,${encodeURIComponent(query)}`;
  if (location?.trim()) {
    url += `/city,${encodeURIComponent(location.trim())}`;
  }
  return url;
};
const JOB_URL = (id: string): string => `https://bulldogjob.pl/companies/jobs/${id}`;

/**
 * BulldogJob strategy — manual page scrape.
 *
 * BulldogJob is a Next.js app that ships the full result set for each page in
 * the embedded `__NEXT_DATA__` JSON (50 offers/page). We use the structured
 * `skills,{query}` filter (the same one the site applies when you pick a
 * technology) rather than free-text `keyword`, which returns anything that
 * merely mentions the term. Server-side pagination works through the `/page,N`
 * URL segment, so we drive a real browser page by page and read the embedded
 * data — no detail page visit is needed, the listing already carries
 * position/company/city/salary/tech/seniority.
 */
@Injectable()
export class BulldogJobStrategy implements JobScraperStrategy {
  readonly source = JobSource.BULLDOGJOB;
  private readonly logger = new Logger(BulldogJobStrategy.name);

  private static readonly MAX_PAGES = 40;

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();
    const location = params.location?.trim() || undefined;
    const byId = new Map<string, BdjJob>();

    try {
      await this.fetcher.withPage(async (page) => {
        for (let p = 1; p <= BulldogJobStrategy.MAX_PAGES; p++) {
          const url = p === 1 ? SEARCH_BASE(query, location) : `${SEARCH_BASE(query, location)}/page,${p}`;
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

          const pageProps = await page.evaluate(
            () => (window as unknown as { __NEXT_DATA__?: NextData }).__NEXT_DATA__?.props?.pageProps,
          );
          const jobs = pageProps?.jobs ?? [];

          if (p === 1) {
            this.logger.log(`"${query}" — ${pageProps?.totalCount ?? '?'} total reported`);
          }

          if (jobs.length === 0) {
            break;
          }

          const before = byId.size;
          for (const j of jobs) {
            if (j?.id) {
              byId.set(j.id, j);
            }
          }

          if (byId.size === before) {
            break;
          }
        }
      });
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    let jobs = [...byId.values()];
    if (params.remoteType === RemoteType.REMOTE) {
      jobs = jobs.filter((j) => j.remote);
    }

    this.logger.log(`"${query}" → ${jobs.length} offers (remote=${params.remoteType === RemoteType.REMOTE})`);

    return jobs.map((j) => ({
      externalId: j.id,
      title: j.position ?? 'Untitled',
      company: j.company?.name ?? 'Unknown',
      sourceUrl: JOB_URL(j.id),
      meta: j,
    }));
  }

  /**
   * The listing covers most fields, but the full description, the real work
   * modes (on-site / hybrid / remote) and the publish date live only on the
   * offer page's embedded __NEXT_DATA__ — the listing carries just a coarse
   * `remote` boolean and no body. We fetch the offer page once and read them.
   */
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const j = stub.meta as BdjJob | undefined;
    const salary = this.parseSalary(j?.denominatedSalaryLong);
    const detail = await this.fetchDetail(stub.sourceUrl);

    const remoteTypes = detail.remoteTypes.length
      ? detail.remoteTypes
      : [j?.remote ? RemoteType.REMOTE : RemoteType.ONSITE];

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      location: j?.city || (j?.remote ? 'Remote' : null),
      remoteTypes,
      levels: j?.experienceLevel ? [this.mapLevel(j.experienceLevel)] : [],
      employmentTypes: this.mapEmployment(j),
      techStack: j?.technologyTags ?? [],
      description: detail.description ?? undefined,
      language: Language.PL,
      publishedDate: detail.publishedAt ? new Date(detail.publishedAt) : null,
    };
  }

  /** Read work modes + full description + publish date from the offer page. */
  private async fetchDetail(url: string): Promise<{ remoteTypes: RemoteType[]; description: string | null; publishedAt: string | null }> {
    const empty = { remoteTypes: [] as RemoteType[], description: null, publishedAt: null };
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KZPanel-Scraper/1.0)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return empty;
      }
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) {
        return empty;
      }
      const job = JSON.parse(m[1])?.props?.pageProps?.data?.job as BdjDetail | undefined;
      const remoteTypes = new Set<RemoteType>();
      for (const mode of job?.workModes ?? []) {
        remoteTypes.add(this.mapWorkMode(mode.toLowerCase()));
      }
      return {
        remoteTypes: [...remoteTypes],
        description: this.htmlToText(job?.details),
        publishedAt: job?.publishedAt ?? null,
      };
    } catch {
      return empty;
    }
  }

  private htmlToText(html?: string | null): string | null {
    if (!html) {
      return null;
    }
    return html
      .replace(/<\/(p|li|h[1-6]|div|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  }

  private mapWorkMode(mode: string): RemoteType {
    if (mode.includes('remote')) {
      return RemoteType.REMOTE;
    }

    if (mode.includes('hybrid')) {
      return RemoteType.HYBRID;
    }
    return RemoteType.ONSITE;
  }

  private mapEmployment(j?: BdjJob): string[] {
    const out: string[] = [];
    if (j?.contractB2b) {
      out.push('B2B');
    }

    if (j?.contractEmployment) {
      out.push('PERMANENT');
    }

    if (j?.contractOther) {
      out.push('OTHER');
    }
    return out;
  }

  /** Parse "17 600 - 20 800" / "20 800" into numeric min/max. */
  private parseSalary(s?: BdjSalary): { min: number | null; max: number | null; currency: string | null } {
    if (!s || s.hidden || !s.money) {
      return { min: null, max: null, currency: null };
    }
    const parts = s.money.split('-').map((p) => Number(p.replace(/[^0-9]/g, '')));
    const min = Number.isFinite(parts[0]) ? parts[0] : null;
    const max = parts.length > 1 && Number.isFinite(parts[1]) ? parts[1] : min;
    return { min, max, currency: s.currency ?? null };
  }

  private mapLevel(level?: string): JobLevel {
    switch ((level ?? '').toLowerCase()) {
      case 'intern':
      case 'trainee':
        return JobLevel.INTERN;
      case 'junior':
        return JobLevel.JUNIOR;
      case 'senior':
        return JobLevel.SENIOR;
      case 'lead':
      case 'expert':
        return JobLevel.LEAD;
      default:
        return JobLevel.MID;
    }
  }
}

interface BdjSalary {
  money?: string;
  currency?: string;
  hidden?: boolean;
}
interface BdjJob {
  id: string;
  position?: string;
  company?: { name?: string };
  city?: string;
  remote?: boolean;
  experienceLevel?: string;
  technologyTags?: string[];
  denominatedSalaryLong?: BdjSalary;
  contractB2b?: boolean;
  contractEmployment?: boolean;
  contractOther?: boolean;
}
interface BdjDetail {
  workModes?: string[];
  details?: string | null;
  publishedAt?: string | null;
}
interface NextData {
  props?: { pageProps?: { jobs?: BdjJob[]; totalCount?: number } };
}
