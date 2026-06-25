import { JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API = 'https://nofluffjobs.com/api';
const UA = 'Mozilla/5.0 (compatible; KZPanel-Scraper/1.0)';
const SEARCH_URL = (query: string): string => `https://nofluffjobs.com/pl/${encodeURIComponent(query)}`;
const JOB_URL = (path: string): string => `https://nofluffjobs.com${path}`;

/**
 * NoFluffJobs strategy — manual page scrape.
 *
 * The results page (/pl/{tech}) is an Angular SPA that shows 20 offers and a
 * "Pokaż kolejne oferty" button — there is no infinite scroll, so we click that
 * button (via JS, to dodge cookie/tooltip overlays that intercept real clicks)
 * until the list stops growing, then read every card. The card already carries
 * title/company/location/salary/tech, so no per-offer detail visit is needed.
 */
@Injectable()
export class NoFluffJobsStrategy implements JobScraperStrategy {
  readonly source = JobSource.NOFLUFFJOBS;
  private readonly logger = new Logger(NoFluffJobsStrategy.name);

  private static readonly MAX_CLICKS = 100;

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();
    let cards: NfjCard[] = [];

    try {
      cards = await this.fetcher.withPage(async (page) => {
        await page.goto(SEARCH_URL(query), { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2_500);

        await this.loadAllOffers(page);

        return page.evaluate(() => {
          const currency = /(PLN|EUR|USD|GBP|CHF)/;
          const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();
          // strip the "NOWA"/"NEW" badge text that renders inside the title
          const cleanTitle = (s: string): string => clean(s).replace(/\s*\b(NOWA|NEW)\b\s*$/i, '').trim();

          return Array.from(document.querySelectorAll('a.posting-list-item')).map((card) => {
            const text = (sel: string): string => clean(card.querySelector(sel)?.textContent ?? '');
            const tags = Array.from(card.querySelectorAll('.posting-tag'))
              .map((e) => clean(e.textContent ?? ''))
              .filter(Boolean);

            const salaryRaw = tags.find((t) => currency.test(t)) ?? null;
            const nonSalary = tags.filter((t) => !currency.test(t));
            // first non-salary tag is the category (Frontend/Backend/…) → drop it
            const tech = nonSalary.slice(1);

            return {
              path: card.getAttribute('href') ?? '',
              title: cleanTitle(card.querySelector('.posting-title__position')?.textContent ?? '') || 'Untitled',
              company: text('.company-name') || text('.posting-title__company') || 'Unknown',
              location: text('.posting-info__location') || null,
              salaryRaw,
              tech,
            };
          });
        });
      });
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    let valid = cards.filter((c) => c.path);
    if (params.remoteType === RemoteType.REMOTE) {
      valid = valid.filter((c) => this.isRemote(c.location));
    }

    this.logger.log(`"${query}" → ${valid.length} offers (remote=${params.remoteType === RemoteType.REMOTE})`);

    return valid.map((c) => ({
      externalId: c.path,
      title: c.title,
      company: c.company,
      sourceUrl: JOB_URL(c.path),
      meta: c,
    }));
  }

  /**
   * The card covers salary/location/tech; the rich content (description,
   * must/nice-to-have, responsibilities, benefits) comes from NFJ's stable
   * per-offer detail API (a different endpoint than the flaky search API).
   */
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const c = stub.meta as NfjCard | undefined;
    const salary = this.parseSalary(c?.salaryRaw);

    const base: JobRaw = {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      salaryRaw: c?.salaryRaw ?? null,
      location: c?.location ?? null,
      remoteTypes: [this.isRemote(c?.location) ? RemoteType.REMOTE : RemoteType.HYBRID],
      techStack: c?.tech ?? [],
      language: Language.PL,
    };

    const id = (c?.path ?? '').split('/').filter(Boolean).pop();
    if (!id) {
      return base;
    }

    try {
      const res = await fetch(`${API}/posting/${id}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return base;
      }
      const d = (await res.json()) as NfjDetail;
      const musts = (d.requirements?.musts ?? []).map((m) => m.value).filter(Boolean);
      const nices = (d.requirements?.nices ?? []).map((m) => m.value).filter(Boolean);
      const responsibilities = (d.specs?.dailyTasks ?? []).filter((t) => typeof t === 'string');
      const benefits = (d.benefits?.benefits ?? []).filter((b) => typeof b === 'string');
      const description = this.htmlToText(d.requirements?.description) || responsibilities[0] || null;

      return {
        ...base,
        description: description ?? undefined,
        techStack: musts.length ? musts : base.techStack,
        requirements: musts,
        mustHave: musts,
        niceToHave: nices,
        responsibilities,
        benefits,
        language: this.detectLanguage(`${stub.title} ${musts.join(' ')} ${responsibilities.join(' ')}`),
      };
    } catch {
      return base;
    }
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

  /**
   * Click "Pokaż kolejne oferty" until the list stops growing or runs dry.
   * After each click we wait for the card count to actually increase (instead of
   * a fixed delay) so a slow/headless environment doesn't stop after the first
   * batch of 20.
   */
  private async loadAllOffers(page: import('playwright-core').Page): Promise<void> {
    const CARD = 'a.posting-list-item';
    await page.waitForSelector(CARD, { timeout: 15_000 }).catch(() => undefined);

    let previous = 0;
    let stale = 0;

    for (let i = 0; i < NoFluffJobsStrategy.MAX_CLICKS; i++) {
      const clicked = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find((b) =>
          /Pokaż kolejne oferty/i.test(b.textContent ?? ''),
        );
        if (!button) {
          return false;
        }
        (button as HTMLButtonElement).click();
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

  private isRemote(location?: string | null): boolean {
    return /zdalnie|remote/i.test(location ?? '');
  }

  /** Parse "21 840 – 23 520 PLN" / "20 000 PLN" into numeric min/max + currency. */
  private parseSalary(raw?: string | null): { min: number | null; max: number | null; currency: string | null } {
    if (!raw) {
      return { min: null, max: null, currency: null };
    }
    const currency = raw.match(/(PLN|EUR|USD|GBP|CHF)/)?.[1] ?? null;
    const parts = raw
      .replace(/(PLN|EUR|USD|GBP|CHF)/g, '')
      .split(/[–—-]/)
      .map((p) => Number(p.replace(/[^0-9]/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0);

    const min = parts[0] ?? null;
    const max = parts[1] ?? min;
    return { min, max, currency };
  }
}

interface NfjCard {
  path: string;
  title: string;
  company: string;
  location: string | null;
  salaryRaw: string | null;
  tech: string[];
}

interface NfjDetail {
  requirements?: {
    musts?: { value: string }[];
    nices?: { value: string }[];
    description?: string | null;
  };
  specs?: { dailyTasks?: string[] };
  benefits?: { benefits?: string[] };
}
