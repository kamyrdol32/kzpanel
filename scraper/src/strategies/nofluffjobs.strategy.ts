import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API = 'https://nofluffjobs.com/api';
const UA = 'Mozilla/5.0 (compatible; KZPanel-Scraper/1.0)';
const JOB_URL = (path: string): string => `https://nofluffjobs.com${path}`;
const ALL_URL = (query: string): string => `https://nofluffjobs.com/pl/${encodeURIComponent(query)}`;
const CITY_URL = (query: string, city: string): string =>
  `https://nofluffjobs.com/pl/praca/${encodeURIComponent(city)}/${encodeURIComponent(query)}`;
const REMOTE_URL = (query: string): string =>
  `https://nofluffjobs.com/pl/praca/zdalna/${encodeURIComponent(query)}`;

/**
 * NoFluffJobs strategy.
 * Listing page (Playwright) collects only job slugs + title + company.
 * All structured data (salary, location, work mode, level, employment type)
 * comes from the per-offer detail API which is stable and complete.
 * When a city is set, two pages are scraped in parallel: the city page and the
 * remote-only page, so remote offers are always included regardless of location.
 */
@Injectable()
export class NoFluffJobsStrategy implements JobScraperStrategy {
  readonly source = JobSource.NOFLUFFJOBS;
  private readonly logger = new Logger(NoFluffJobsStrategy.name);

  private static readonly MAX_LOAD_MORE = 100;

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = params.query?.trim() ?? '';
    const citySlug = params.location?.trim() ? this.normalize(params.location.trim()) : undefined;

    let cards: NfjCard[];

    if (params.remoteType === RemoteType.REMOTE) {
      cards = await this.scrapeListPage(REMOTE_URL(query));
    } else if (citySlug) {
      const [cityCards, remoteCards] = await Promise.all([
        this.scrapeListPage(CITY_URL(query, citySlug)),
        this.scrapeListPage(REMOTE_URL(query)),
      ]);
      const seen = new Set<string>();
      cards = [...cityCards, ...remoteCards].filter((c) => {
        if (seen.has(c.path)) {
          return false;
        }
        seen.add(c.path);
        return true;
      });
    } else {
      cards = await this.scrapeListPage(ALL_URL(query));
    }

    this.logger.log(`"${query}" → ${cards.length} listings`);

    return cards.map((c) => ({
      externalId: c.path,
      title: c.title,
      company: c.company,
      sourceUrl: JOB_URL(c.path),
      meta: { ...c, _query: query },
    }));
  }

  async fetchDetails(stub: JobStub): Promise<JobRaw | null> {
    const id = stub.externalId.split('/').filter(Boolean).pop() ?? '';

    const base: JobRaw = {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      remoteTypes: [],
      language: Language.PL,
    };

    if (!id) {
      return base;
    }

    try {
      const res = await fetch(`${API}/posting/${id}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        this.logger.warn(`Detail API ${res.status} for ${id}`);
        return base;
      }
      const d = (await res.json()) as NfjDetail;

      const remoteValue = d.location?.remote ?? 0;
      const remoteTypes =
        remoteValue === 5
          ? [RemoteType.REMOTE]
          : remoteValue === 3
            ? [RemoteType.HYBRID]
            : [RemoteType.ONSITE];

      const officePlaces = (d.location?.places ?? []).filter(
        (p) => p.city && p.city !== 'Remote' && !p.provinceOnly,
      );
      const location = officePlaces[0]?.city ?? null;

      const origSalary = d.essentials?.originalSalary;
      const salaryTypes = origSalary?.types ?? {};
      const currency = origSalary?.currency?.toUpperCase() ?? null;
      const salaryEntry =
        salaryTypes.b2b ??
        salaryTypes.permanent ??
        (Object.values(salaryTypes).find(Boolean) ?? null);
      const range = salaryEntry?.range;
      const period = (salaryEntry?.period ?? 'Month').toLowerCase();
      const periodMultiplier = period === 'hour' ? 168 : period === 'day' ? 22 : 1;
      const salaryMin = range?.[0] != null ? Math.round(range[0] * periodMultiplier) : null;
      const salaryMax = range?.[1] != null ? Math.round(range[1] * periodMultiplier) : null;
      const salaryRaw =
        salaryMin && salaryMax ? `${salaryMin} – ${salaryMax} ${currency ?? ''}`.trim() : null;

      const employmentTypes = Object.keys(salaryTypes)
        .map((k) => this.mapEmployment(k))
        .filter((e): e is string => e !== null);

      const levels = (d.basics?.seniority ?? [])
        .map((s) => this.mapLevel(s))
        .filter((l): l is JobLevel => l !== null);

      const musts = (d.requirements?.musts ?? []).map((m) => m.value).filter(Boolean);
      const nices = (d.requirements?.nices ?? []).map((m) => m.value).filter(Boolean);
      const responsibilities = (d.specs?.dailyTasks ?? []).filter((t) => typeof t === 'string');
      const benefits = (d.benefits?.benefits ?? []).filter((b) => typeof b === 'string');
      const description =
        this.htmlToText(d.details?.description ?? d.requirements?.description) || null;

      const result: JobRaw = {
        ...base,
        location,
        remoteTypes,
        levels,
        employmentTypes,
        salaryMin,
        salaryMax,
        currency,
        salaryRaw,
        description: description ?? undefined,
        techStack: musts.length ? musts : [],
        requirements: musts,
        mustHave: musts,
        niceToHave: nices,
        responsibilities,
        benefits,
        language: this.detectLanguage(`${stub.title} ${musts.join(' ')} ${responsibilities.join(' ')}`),
        publishedDate: d.posted != null ? new Date(d.posted) : null,
      };

      const q = ((stub.meta as any)?._query ?? '').toLowerCase().trim();
      if (q) {
        const searchText = [
          result.title,
          result.description ?? '',
          ...(result.techStack ?? []),
          ...(result.mustHave ?? []),
          ...(result.niceToHave ?? []),
          ...(result.responsibilities ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!searchText.includes(q)) {
          return null;
        }
      }

      return result;
    } catch (err) {
      this.logger.warn(`fetchDetails failed for ${id}: ${(err as Error).message}`);
      return base;
    }
  }

  private async scrapeListPage(url: string): Promise<NfjCard[]> {
    try {
      return await this.fetcher.withPage(async (page) => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2_500);
        await this.loadAllOffers(page);

        return page.evaluate(() => {
          const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();
          // strip "NOWA"/"NEW" badge text that renders inside the title
          const stripBadge = (s: string): string =>
            clean(s)
              .replace(/\s*\b(NOWA|NEW)\b\s*$/i, '')
              .trim();

          const seen = new Set<string>();
          return Array.from(
            document.querySelectorAll('a.posting-list-item, a[href*="/pl/job/"]'),
          )
            .filter((a) => {
              const href = a.getAttribute('href') ?? '';
              if (!href || seen.has(href)) {
                return false;
              }
              seen.add(href);
              return true;
            })
            .map((a) => {
              const text = (sel: string): string =>
                clean(a.querySelector(sel)?.textContent ?? '');
              return {
                path: a.getAttribute('href') ?? '',
                title:
                  stripBadge(a.querySelector('.posting-title__position')?.textContent ?? '') ||
                  stripBadge(a.querySelector('[class*="title"]')?.textContent ?? '') ||
                  'Untitled',
                company:
                  text('.company-name') ||
                  text('.posting-title__company') ||
                  text('[class*="company"]') ||
                  'Unknown',
              };
            })
            .filter((c) => c.path);
        });
      });
    } catch (err) {
      this.logger.warn(`scrapeListPage failed for ${url}: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Click "Pokaż kolejne oferty" until the list stops growing or runs dry.
   * After each click we wait for the card count to actually increase (instead of
   * a fixed delay) so a slow/headless environment doesn't stop after the first
   * batch of 20.
   */
  private async loadAllOffers(page: import('playwright-core').Page): Promise<void> {
    const CARD = 'a.posting-list-item, a[href*="/pl/job/"]';
    await page.waitForSelector(CARD, { timeout: 15_000 }).catch(() => undefined);

    let previous = 0;
    let stale = 0;

    for (let i = 0; i < NoFluffJobsStrategy.MAX_LOAD_MORE; i++) {
      const clicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) =>
          /Pokaż kolejne oferty/i.test(b.textContent ?? ''),
        );
        if (!btn) {
          return false;
        }
        (btn as HTMLButtonElement).click();
        return true;
      });
      if (!clicked) {
        break;
      }

      await page.waitForTimeout(2_000);

      const count = await page.locator(CARD).count();
      if (count > previous) {
        previous = count;
        stale = 0;
      } else {
        // a click sometimes lands as a no-op; only give up after several in a row
        stale++;
        if (stale >= 4) {
          break;
        }
      }
    }
  }

  private mapLevel(s: string): JobLevel | null {
    switch (s.toLowerCase()) {
      case 'junior':
        return JobLevel.JUNIOR;
      case 'mid':
        return JobLevel.MID;
      case 'senior':
        return JobLevel.SENIOR;
      case 'expert':
      case 'lead':
      case 'manager':
        return JobLevel.LEAD;
      default:
        return null;
    }
  }

  private mapEmployment(type: string): string | null {
    const t = (type ?? '').toLowerCase();
    if (t.includes('b2b')) {
      return 'B2B';
    }
    if (t.includes('permanent') || t.includes('uop') || t.includes('employment')) {
      return 'PERMANENT';
    }
    if (t.includes('mandate') || t.includes('zlecenie')) {
      return 'MANDATE';
    }
    return null;
  }

  private detectLanguage(text: string): Language {
    return /[ąćęłńóśźż]/i.test(text) ? Language.PL : Language.EN;
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

  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
      .trim();
  }
}

interface NfjCard {
  path: string;
  title: string;
  company: string;
}

interface NfjSalaryEntry {
  period?: string;
  range?: number[];
  paidHoliday?: boolean;
}

interface NfjDetail {
  basics?: { seniority?: string[]; category?: string; technology?: string };
  details?: { description?: string | null };
  location?: {
    remote?: number;
    remoteFlexible?: boolean;
    places?: { city?: string; provinceOnly?: boolean }[];
  };
  essentials?: {
    originalSalary?: {
      currency?: string;
      disclosedAt?: string;
      types?: { b2b?: NfjSalaryEntry; permanent?: NfjSalaryEntry; [key: string]: NfjSalaryEntry | undefined };
    };
  };
  requirements?: {
    musts?: { value: string }[];
    nices?: { value: string }[];
    description?: string | null;
  };
  specs?: { dailyTasks?: string[] };
  benefits?: { benefits?: string[] };
  posted?: number;
}
