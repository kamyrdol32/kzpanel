import { JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const SEARCH_URL = (query: string, location?: string): string => {
  const base = `https://theprotocol.it/filtry/${encodeURIComponent(query)};t`;
  if (location?.trim()) {
    return `${base}/${encodeURIComponent(location.trim())};c`;
  }
  return base;
};

/**
 * theprotocol.it strategy — manual page scrape.
 *
 * A Next.js board behind bot-protection (the stealth browser gets past it).
 * We use the technology filter (`/filtry/{tech};t`) — the same one the site
 * applies when you pick a technology — rather than free-text keyword, which
 * returns the whole board. The results page lists offers as
 * `[data-test="list-item-offer"]` anchors with title/employer/salary/work-modes;
 * pagination is URL-based (?pageNumber=N).
 * The full description, responsibilities, requirements and benefits come from
 * the offer page (rich `section-*` data-tests).
 */
@Injectable()
export class TheProtocolStrategy implements JobScraperStrategy {
  readonly source = JobSource.THEPROTOCOL;
  private readonly logger = new Logger(TheProtocolStrategy.name);

  private static readonly MAX_PAGES = 50;

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();
    const location = params.location?.trim() || undefined;
    const byUrl = new Map<string, TpCard>();

    try {
      await this.fetcher.withPage(async (page) => {
        for (let pn = 1; pn <= TheProtocolStrategy.MAX_PAGES; pn++) {
          const url = pn === 1 ? SEARCH_URL(query, location) : `${SEARCH_URL(query, location)}?pageNumber=${pn}`;
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 });
          await page.waitForSelector('[data-test="list-item-offer"]', { timeout: 15_000 }).catch(() => undefined);
          await page.waitForTimeout(800);

          const cards = await this.extractCards(page);
          if (cards.length === 0) {
            break;
          }
          const before = byUrl.size;
          for (const c of cards) {
            if (c.url) {
              byUrl.set(c.url, c);
            }
          }

          if (byUrl.size === before) {
            break;
          }
        }
      });
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    let cards = [...byUrl.values()];
    if (location) {
      const needle = this.stripDiacritics(location.toLowerCase());
      cards = cards.filter((c) => {
        const isRemote = /zdaln/i.test(c.workModes);
        const cityMatch = this.stripDiacritics(c.location.toLowerCase()).includes(needle);
        return isRemote || cityMatch;
      });
    }

    this.logger.log(`"${query}" → ${cards.length} offers (remote=${params.remoteType === RemoteType.REMOTE})`);

    return cards.map((c) => ({
      externalId: c.url,
      title: c.title || 'Untitled',
      company: c.employer || 'Unknown',
      sourceUrl: c.url,
      meta: c,
    }));
  }

  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const c = stub.meta as TpCard | undefined;
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
      location: c?.location || null,
      remoteTypes: this.mapWorkModes(c?.workModes),
      levels: [],
      employmentTypes: this.mapEmployment(c?.salary),
      techStack: detail?.techStack ?? [],
      description: detail?.description ?? undefined,
      responsibilities: detail?.responsibilities ?? [],
      requirements: detail?.requirements ?? [],
      mustHave: detail?.requirements ?? [],
      niceToHave: detail?.niceToHave ?? [],
      benefits: detail?.benefits ?? [],
      language: Language.PL,
    };
  }

  private stripDiacritics(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
  }

  private extractCards(page: import('playwright-core').Page): Promise<TpCard[]> {
    return page.evaluate(() => {
      const norm = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
      return Array.from(document.querySelectorAll('[data-test="list-item-offer"]')).map((card) => {
        const t = (dt: string): string => norm(card.querySelector(`[data-test="${dt}"]`)?.textContent);
        const href = (card as HTMLAnchorElement).href || (card.querySelector('a') as HTMLAnchorElement | null)?.href || '';
        return {
          url: href.split('?')[0],
          title: t('text-jobTitle'),
          employer: t('text-employerName'),
          salary: t('text-salary'),
          workModes: t('text-workModes'),
          location: t('chip-location') || t('text-workplaces'),
        };
      });
    });
  }

  private async fetchDetailContent(
    url: string,
  ): Promise<{ description: string | null; responsibilities: string[]; requirements: string[]; niceToHave: string[]; benefits: string[]; techStack: string[] } | null> {
    return this.fetcher.extractDetail(url, async (page) => {
      await page
        .waitForSelector('[data-test="section-responsibilities"], [data-test="section-requirements-expected"]', { timeout: 12_000 })
        .catch(() => undefined);
      return page.evaluate(() => {
        const norm = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
        const list = (sel: string): string[] =>
          Array.from(document.querySelectorAll(sel)).map((e) => norm(e.textContent)).filter(Boolean);
        const responsibilities = list('[data-test="section-responsibilities"] li');
        const requirements = list('[data-test="section-requirements-expected"] li');
        const niceToHave = list('[data-test="section-requirements-optional"] li');
        const benefits = list('[data-test="section-benefits"] li');
        const techStack = list('[data-test="chip-technology"], [data-test="chip-expectedTechnology"]');
        const aboutText = norm(document.querySelector('[data-test="section-description"]')?.textContent);
        const description = aboutText || responsibilities.join('\n') || null;
        return { description, responsibilities, requirements, niceToHave, benefits, techStack };
      });
    });
  }

  private mapWorkModes(workModes?: string): RemoteType[] {
    const text = (workModes ?? '').toLowerCase();
    const out = new Set<RemoteType>();
    if (/zdaln/.test(text)) {
      out.add(RemoteType.REMOTE);
    }

    if (/hybryd/.test(text)) {
      out.add(RemoteType.HYBRID);
    }

    if (/stacjonar/.test(text)) {
      out.add(RemoteType.ONSITE);
    }
    return out.size ? [...out] : [RemoteType.ONSITE];
  }

  private mapEmployment(salary?: string): string[] {
    const text = (salary ?? '').toLowerCase();
    const out = new Set<string>();
    if (/b2b/.test(text)) {
      out.add('B2B');
    }

    if (/uop|umowa o pracę|umowę o pracę/.test(text)) {
      out.add('PERMANENT');
    }

    if (/zlecenie|\buz\b/.test(text)) {
      out.add('MANDATE');
    }

    if (/dzieło|\buod\b/.test(text)) {
      out.add('OTHER');
    }
    return [...out];
  }

  /** Parse "7.6k–14.2k zł / mies. (UoP)" → numeric min/max (k = ×1000). */
  private parseSalary(raw?: string): { min: number | null; max: number | null; currency: string | null } {
    if (!raw) {
      return { min: null, max: null, currency: null };
    }
    const currency = /zł|pln/i.test(raw) ? 'PLN' : raw.match(/EUR|USD|GBP/i)?.[0]?.toUpperCase() ?? null;
    const firstRange = raw.split(',')[0];
    const nums = [...firstRange.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|tys)?/gi)]
      .map((m) => {
        const n = Number(m[1].replace(',', '.'));
        return m[2] ? Math.round(n * 1000) : Math.round(n);
      })
      .filter((n) => Number.isFinite(n) && n > 0);

    return { min: nums[0] ?? null, max: nums[1] ?? nums[0] ?? null, currency };
  }
}

interface TpCard {
  url: string;
  title: string;
  employer: string;
  salary: string;
  workModes: string;
  location: string;
}
