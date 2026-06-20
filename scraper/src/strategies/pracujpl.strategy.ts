import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const SEARCH_URL = (query: string): string =>
  `https://www.pracuj.pl/praca/${encodeURIComponent(query)};kw`;

/**
 * Pracuj.pl strategy — manual page scrape.
 *
 * The results page is a React app behind Cloudflare; the stealth-patched
 * browser (see PlaywrightFetcher) gets past the "managed challenge" that
 * otherwise blocks every paginated request. Pagination is plain URL-based
 * (?pn=N), 50 offers/page, and every field we need lives on the result card
 * (stable data-test attributes), so no detail page visit is required.
 */
@Injectable()
export class PracujPlStrategy implements JobScraperStrategy {
  readonly source = JobSource.PRACUJPL;
  private readonly logger = new Logger(PracujPlStrategy.name);

  private static readonly MAX_PAGES = 50;

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();
    const byId = new Map<string, PracujCard>();

    try {
      await this.fetcher.withPage(async (page) => {
        await page.goto(SEARCH_URL(query), { waitUntil: 'domcontentloaded', timeout: 40_000 });
        await this.acceptCookies(page);
        await page.waitForSelector('[data-test="default-offer"]', { timeout: 15_000 }).catch(() => undefined);

        const maxPage = await page.evaluate(() => {
          const el = document.querySelector('[data-test="top-pagination-max-page-number"]');
          return Number(el?.textContent?.trim() ?? '1') || 1;
        });
        this.logger.log(`"${query}" — ${maxPage} page(s)`);

        const pages = Math.min(maxPage, PracujPlStrategy.MAX_PAGES);
        for (let pn = 1; pn <= pages; pn++) {
          if (pn > 1) {
            await page.goto(`${SEARCH_URL(query)}?pn=${pn}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
            await page.waitForSelector('[data-test="default-offer"]', { timeout: 15_000 }).catch(() => undefined);
            await page.waitForTimeout(800);
          }

          const cards = await this.extractCards(page);
          if (cards.length === 0) {
            break;
          }
          for (const c of cards) {
            if (c.id) {
              byId.set(c.id, c);
            }
          }
        }
      });
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    let cards = [...byId.values()];
    if (params.remoteType === RemoteType.REMOTE) {
      cards = cards.filter((c) => this.isRemote(c.region));
    }

    this.logger.log(`"${query}" → ${cards.length} offers (remote=${params.remoteType === RemoteType.REMOTE})`);

    return cards
      .filter((c) => c.url)
      .map((c) => ({
        externalId: c.url,
        title: c.title || 'Untitled',
        company: c.company || 'Unknown',
        sourceUrl: c.url,
        meta: c,
      }));
  }

  // The card covers the summary; the description, responsibilities,
  // requirements and tech come from the offer page (rendered through the
  // stealth browser, since pracuj.pl is behind Cloudflare).
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const c = stub.meta as PracujCard | undefined;
    const salary = this.parseSalary(c?.salary);
    const detail = await this.fetchDetailContent(stub.sourceUrl);

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      salaryRaw: c?.salary || null,
      location: this.parseLocation(c?.region),
      remoteTypes: [this.isRemote(c?.region) ? RemoteType.REMOTE : RemoteType.ONSITE],
      levels: this.mapLevels(c?.seniority),
      employmentTypes: this.mapEmployment(c?.info),
      techStack: detail?.techStack ?? [],
      description: detail?.description ?? undefined,
      responsibilities: detail?.responsibilities ?? [],
      requirements: detail?.requirements ?? [],
      language: Language.PL,
    };
  }

  /** Render the offer page (Cloudflare → stealth) and read description/lists/tech. */
  private async fetchDetailContent(
    url: string,
  ): Promise<{ description: string | null; responsibilities: string[]; requirements: string[]; techStack: string[] } | null> {
    return this.fetcher.extractDetail(url, async (page) => {
      await page
        .waitForSelector('[data-test="text-about-project"], [data-test="section-responsibilities"]', { timeout: 12_000 })
        .catch(() => undefined);

      return page.evaluate(() => {
        const norm = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
        const list = (sel: string): string[] =>
          Array.from(document.querySelectorAll(sel)).map((e) => norm(e.textContent)).filter(Boolean);
        const about = norm(document.querySelector('[data-test="text-about-project"]')?.textContent);
        const responsibilities = list('[data-test="section-responsibilities"] li, [data-test="aggregated-responsibilities"] li');
        const requirements = list('[data-test="section-requirements"] li, [data-test="aggregated-requirements"] li');
        const techStack = list('[data-test="item-technologies-expected"]');
        const description = about || [...responsibilities, ...requirements].join('\n') || null;
        return { description, responsibilities, requirements, techStack };
      });
    });
  }

  private extractCards(page: import('playwright-core').Page): Promise<PracujCard[]> {
    return page.evaluate(() => {
      const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();
      return Array.from(document.querySelectorAll('[data-test="default-offer"]')).map((card) => {
        const t = (dt: string): string => norm(card.querySelector(`[data-test="${dt}"]`)?.textContent ?? '');
        const href = card.querySelector('[data-test="link-offer"]')?.getAttribute('href') ?? '';
        return {
          id: card.getAttribute('data-test-offerid') ?? '',
          title: t('offer-title'),
          company: t('text-company-name'),
          salary: t('offer-salary'),
          region: t('text-region'),
          seniority: t('offer-additional-info-0'),
          info: Array.from(card.querySelectorAll('[data-test^="offer-additional-info-"]'))
            .map((e) => norm(e.textContent ?? ''))
            .join(' | '),
          url: href.split('?')[0],
        };
      });
    });
  }

  /** Best-effort dismissal of the Cloudflare/cookies consent dialog. */
  private async acceptCookies(page: import('playwright-core').Page): Promise<void> {
    await page
      .locator('[data-test="button-submitCookie"]')
      .click({ timeout: 8_000 })
      .catch(() => undefined);
    await page.waitForTimeout(800);
  }

  private isRemote(region?: string): boolean {
    return /zdaln/i.test(region ?? '');
  }

  /**
   * Map the seniority line (e.g. "Specjalista (Mid / Regular), Starszy
   * specjalista (Senior)") to seniority levels. An offer may list several.
   */
  private mapLevels(seniority?: string): JobLevel[] {
    const text = (seniority ?? '').toLowerCase();
    if (!text) {
      return [];
    }
    const levels = new Set<JobLevel>();
    if (/praktykant|trainee|intern|staż|stazyst/.test(text)) levels.add(JobLevel.INTERN);
    if (/junior|młodszy|mlodszy/.test(text)) levels.add(JobLevel.JUNIOR);
    if (/\bmid\b|regular|^specjalista|, specjalista|\(specjalista/.test(text)) levels.add(JobLevel.MID);
    if (/senior|starszy/.test(text)) levels.add(JobLevel.SENIOR);
    if (/lead|ekspert|expert|kierownik|manager|menedżer/.test(text)) levels.add(JobLevel.LEAD);
    return [...levels];
  }

  /** Map the additional-info line ("Kontrakt B2B", "Umowa o pracę"…) to forms. */
  private mapEmployment(info?: string): string[] {
    const text = (info ?? '').toLowerCase();
    const out = new Set<string>();
    if (/b2b/.test(text)) out.add('B2B');
    if (/umowa o pracę|umowę o pracę|\buop\b/.test(text)) out.add('PERMANENT');
    if (/zlecenie/.test(text)) out.add('MANDATE');
    if (/o dzieło|dzieło/.test(text)) out.add('OTHER');
    return [...out];
  }

  /** Pull a readable city out of "Miejsce pracy:…Siedziba firmy:Warszawa". */
  private parseLocation(region?: string): string | null {
    if (!region) {
      return null;
    }
    const office = region.match(/Siedziba firmy:\s*(.+)$/i)?.[1];
    if (office) {
      return office.trim();
    }
    return region.replace(/^Miejsce pracy:\s*/i, '').trim() || null;
  }

  /** Parse "120–140 zł" / "18 000–24 000 zł" into numeric min/max + currency. */
  private parseSalary(raw?: string): { min: number | null; max: number | null; currency: string | null } {
    if (!raw) {
      return { min: null, max: null, currency: null };
    }
    const currency = /zł|PLN/i.test(raw) ? 'PLN' : raw.match(/EUR|USD|GBP/i)?.[0]?.toUpperCase() ?? null;
    const parts = (raw.match(/\d[\d\s]*\d|\d/g) ?? [])
      .map((n) => Number(n.replace(/\s/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0);

    return { min: parts[0] ?? null, max: parts[1] ?? parts[0] ?? null, currency };
  }
}

// ── Shape of the data we pull out of each result card ──────────
interface PracujCard {
  id: string;
  title: string;
  company: string;
  salary: string;
  region: string;
  seniority: string;
  info: string;
  url: string;
}
