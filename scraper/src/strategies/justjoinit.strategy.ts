import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API = 'https://api.justjoin.it/v2/user-panel/offers';
const JOB_URL = (slug: string): string => `https://justjoin.it/job-offer/${slug}`;
const UA = 'Mozilla/5.0 (compatible; EvPanel-Scraper/1.0)';

/**
 * JustJoinIT strategy — uses the public v2 API (verified shape):
 *   GET /v2/user-panel/offers?keywords[]={query}&perPage=N  (header Version: 2)
 * The listing carries everything we need (salary/level/workplace/city), so no
 * detail call is required. requiredSkills is not exposed in the list → techStack
 * stays empty for this portal.
 */
@Injectable()
export class JustJoinITStrategy implements JobScraperStrategy {
  readonly source = JobSource.JUSTJOINIT;
  private readonly logger = new Logger(JustJoinITStrategy.name);

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const perPage = 100;
    const q = (params.query ?? '').toLowerCase();
    const encodedQuery = encodeURIComponent(params.query ?? '');
    const allOffers: JjitOffer[] = [];
    let page = 1;
    let totalPages = 1;

    try {
      do {
        const url = `${API}?page=${page}&perPage=${perPage}&sortBy=published&orderBy=DESC&keywords%5B%5D=${encodedQuery}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Version: '2' },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) {
          this.logger.warn(`page ${page} returned HTTP ${res.status}`);
          break;
        }
        const data = (await res.json()) as { data?: JjitOffer[]; meta?: { totalItems?: number } };
        const batch = data.data ?? [];
        allOffers.push(...batch);

        if (page === 1 && data.meta?.totalItems) {
          totalPages = Math.ceil(data.meta.totalItems / perPage);
          this.logger.log(`"${params.query ?? ''}" — ${data.meta.totalItems} total, ${totalPages} page(s)`);
        }

        if (batch.length < perPage) {
          break;
        }

        page++;
      } while (page <= totalPages);

      let offers = q
        ? allOffers.filter(
            (o) =>
              (o.title ?? '').toLowerCase().includes(q) ||
              (o.requiredSkills ?? []).some((s) => s.name?.toLowerCase().includes(q)),
          )
        : allOffers;

      if (params.remoteType === RemoteType.REMOTE) {
        offers = offers.filter((o) => o.workplaceType === 'remote');
      }

      this.logger.log(`"${params.query ?? ''}" → ${offers.length} offers matched (fetched ${allOffers.length}, remote=${params.remoteType === RemoteType.REMOTE})`);

      return offers
        .filter((o) => o.slug)
        .map((o) => ({
          externalId: o.slug,
          title: o.title ?? 'Untitled',
          company: o.companyName ?? 'Unknown',
          sourceUrl: JOB_URL(o.slug),
          meta: o,
        }));
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
      return [];
    }
  }

  // The listing already contains all fields — just map it.
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const o = stub.meta as JjitOffer | undefined;
    const salary = this.mapSalary(o?.employmentTypes?.[0]);

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      location: o?.city ?? null,
      remoteType: this.mapWorkplace(o?.workplaceType),
      level: this.mapLevel(o?.experienceLevel),
      techStack: (o?.requiredSkills ?? []).map((s) => s.name).filter(Boolean),
      language: /[ąćęłńóśźż]/i.test(stub.title) ? Language.PL : Language.EN,
      publishedDate: o?.publishedAt ? new Date(o.publishedAt) : null,
    };
  }

  /** JustJoinIT salaries may be yearly — normalize to monthly for consistency. */
  private mapSalary(e?: JjitEmployment): {
    min: number | null;
    max: number | null;
    currency: string | null;
  } {
    if (!e || (e.from == null && e.to == null)) {
      return { min: null, max: null, currency: null };
    }
    const div = e.unit === 'year' ? 12 : 1;
    return {
      min: e.from != null ? Math.round(e.from / div) : null,
      max: e.to != null ? Math.round(e.to / div) : null,
      currency: e.currency ? e.currency.toUpperCase() : null,
    };
  }

  private mapWorkplace(w?: string): RemoteType {
    switch (w) {
      case 'remote':
        return RemoteType.REMOTE;
      case 'office':
        return RemoteType.ONSITE;
      default:
        return RemoteType.HYBRID;
    }
  }

  private mapLevel(l?: string): JobLevel {
    switch ((l ?? '').toLowerCase()) {
      case 'junior':
        return JobLevel.JUNIOR;
      case 'senior':
        return JobLevel.SENIOR;
      case 'c_level':
      case 'expert':
        return JobLevel.LEAD;
      default:
        return JobLevel.MID;
    }
  }
}

// ── Loose shapes for the public API (only fields we read) ──────
interface JjitEmployment {
  from?: number | null;
  to?: number | null;
  currency?: string;
  unit?: string; // "month" | "year"
}
interface JjitOffer {
  slug: string;
  title?: string;
  companyName?: string;
  city?: string;
  workplaceType?: string;
  experienceLevel?: string;
  employmentTypes?: JjitEmployment[];
  requiredSkills?: { name: string }[] | null;
  publishedAt?: string;
}
