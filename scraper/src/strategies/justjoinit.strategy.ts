import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API = 'https://api.justjoin.it/v2/user-panel/offers';
const JOB_URL = (slug: string): string => `https://justjoin.it/job-offer/${slug}`;
const UA = 'Mozilla/5.0 (compatible; KZPanel-Scraper/1.0)';

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

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const perPage = 100;
    const encodedQuery = encodeURIComponent(params.query ?? '');
    const location = params.location?.trim() || undefined;
    const allOffers: JjitOffer[] = [];
    let page = 1;
    let totalPages = 1;

    try {
      // JustJoinIt expects a single, diacritics-free city param (e.g. "krakow").
      // The array form `city[]=` now returns HTTP 400, and a value with Polish
      // diacritics ("Kraków") is silently ignored. Skip the param entirely when
      // includeAllRemote is set so remote-from-anywhere offers are kept.
      const cityParam =
        location && !params.includeAllRemote ? `&city=${encodeURIComponent(this.normalize(location))}` : '';

      do {
        const url = `${API}?page=${page}&perPage=${perPage}&sortBy=published&orderBy=DESC&keywords%5B%5D=${encodedQuery}${cityParam}`;
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

      // The API already filters by keyword and city, and the list does not expose
      // requiredSkills — so a local title-only re-filter would wrongly drop valid
      // matches (e.g. a backend role that lists Angular among its skills). The
      // city match is likewise left to the API, which also handles multi-location
      // offers a local `o.city` check would miss.
      let offers = allOffers;

      if (params.remoteType === RemoteType.REMOTE) {
        offers = offers.filter((o) => o.workplaceType === 'remote');
      }

      this.logger.log(`"${params.query ?? ''}" → ${offers.length} offers (fetched ${allOffers.length})`);

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
      remoteTypes: [this.mapWorkplace(o?.workplaceType)],
      levels: o?.experienceLevel ? [this.mapLevel(o.experienceLevel)] : [],
      employmentTypes: this.mapEmployment(o?.employmentTypes),
      techStack: (o?.requiredSkills ?? []).map((s) => s.name).filter(Boolean),
      mustHave: (o?.requiredSkills ?? []).map((s) => s.name).filter(Boolean),
      niceToHave: (o?.niceToHaveSkills ?? []).map((s) => s.name).filter(Boolean),
      description: (await this.fetchDescription(stub.sourceUrl)) ?? undefined,
      language: /[ąćęłńóśźż]/i.test(stub.title) ? Language.PL : Language.EN,
      publishedDate: o?.publishedAt ? new Date(o.publishedAt) : null,
    };
  }

  /**
   * JJIT offer pages are a JS-only SPA (no API/SSR for the body), so we render
   * the page and read the text under the "Job description" heading. Best-effort
   * — returns null if the layout doesn't match.
   */
  private async fetchDescription(url: string): Promise<string | null> {
    return this.fetcher.extractDetail(url, async (page) => {
      await page
        .waitForFunction(() => /job description|opis stanowiska/i.test(document.body.innerText), undefined, { timeout: 12_000 })
        .catch(() => undefined);
      return page.evaluate(() => {
        const norm = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
        const heading = Array.from(document.querySelectorAll('h1,h2,h3,h4')).find((h) =>
          /job description|opis stanowiska/i.test(h.textContent ?? ''),
        );
        const container = heading?.parentElement;
        const text = norm(container?.textContent).replace(/^(Job description|Opis stanowiska)/i, '').trim();
        return text.length > 30 ? text : null;
      });
    });
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().trim();
  }

  private mapEmployment(types?: JjitEmployment[]): string[] {
    const out = new Set<string>();
    for (const t of types ?? []) {
      const type = (t.type ?? '').toLowerCase();
      if (type.includes('b2b')) {
        out.add('B2B');
      }

      if (type.includes('permanent') || type.includes('employment')) {
        out.add('PERMANENT');
      }

      if (type.includes('mandate') || type.includes('zlecenie')) {
        out.add('MANDATE');
      }

      if (type && !type.includes('b2b') && !type.includes('permanent') && !type.includes('employment') && !type.includes('mandate') && !type.includes('zlecenie')) {
        out.add('OTHER');
      }
    }
    return [...out];
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
      case 'stationary':
        return RemoteType.ONSITE;
      case 'hybrid':
        return RemoteType.HYBRID;
      default:
        return RemoteType.ONSITE;
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

interface JjitEmployment {
  from?: number | null;
  to?: number | null;
  currency?: string;
  unit?: string; // "month" | "year"
  type?: string; // "b2b" | "permanent" | "mandate_contract" | ...
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
  niceToHaveSkills?: { name: string }[] | null;
  publishedAt?: string;
}
