import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const SEARCH_BASE = (query: string): string =>
  `https://bulldogjob.pl/companies/jobs/s/skills,${encodeURIComponent(query)}`;
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
    const byId = new Map<string, BdjJob>();

    try {
      await this.fetcher.withPage(async (page) => {
        for (let p = 1; p <= BulldogJobStrategy.MAX_PAGES; p++) {
          const url = p === 1 ? SEARCH_BASE(query) : `${SEARCH_BASE(query)}/page,${p}`;
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

  // The listing already carries every field — just map it, no extra request.
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const j = stub.meta as BdjJob | undefined;
    const salary = this.parseSalary(j?.denominatedSalaryLong);

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      location: j?.city || (j?.remote ? 'Remote' : null),
      remoteType: j?.remote ? RemoteType.REMOTE : RemoteType.ONSITE,
      level: this.mapLevel(j?.experienceLevel),
      techStack: j?.technologyTags ?? [],
      language: Language.PL,
    };
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

// ── Shapes for the fields we read out of __NEXT_DATA__ ──────────
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
}
interface NextData {
  props?: { pageProps?: { jobs?: BdjJob[]; totalCount?: number } };
}
