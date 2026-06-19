import { JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

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

  // The card already carries every field — just map it, no extra request.
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const c = stub.meta as NfjCard | undefined;
    const salary = this.parseSalary(c?.salaryRaw);

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      salaryRaw: c?.salaryRaw ?? null,
      location: c?.location ?? null,
      remoteType: this.isRemote(c?.location) ? RemoteType.REMOTE : RemoteType.HYBRID,
      techStack: c?.tech ?? [],
      language: Language.PL,
    };
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

// ── Shape of the data we pull out of each result card ──────────
interface NfjCard {
  path: string;
  title: string;
  company: string;
  location: string | null;
  salaryRaw: string | null;
  tech: string[];
}
