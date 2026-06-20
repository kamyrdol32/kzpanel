import { JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const GUEST_API = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

/**
 * LinkedIn strategy — manual scrape of the public "guest" jobs endpoint.
 *
 * LinkedIn's logged-out job search exposes /jobs-guest/jobs/api/seeMoreJobPostings/search
 * which returns a plain HTML fragment of ~10 cards per `start` offset. We page
 * through it (the stealth browser gets past LinkedIn's bot wall) until it runs
 * dry. The card carries title/company/location/date; salary and tech are not
 * shown logged-out, so we leave them empty rather than visiting gated detail
 * pages.
 */
@Injectable()
export class LinkedInStrategy implements JobScraperStrategy {
  readonly source = JobSource.LINKEDIN;
  private readonly logger = new Logger(LinkedInStrategy.name);

  private static readonly MAX_PAGES = 40;

  constructor(private readonly fetcher: PlaywrightFetcher) {}

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();
    const location = (params.location ?? '').trim() || 'Poland';
    const remote = params.remoteType === RemoteType.REMOTE;

    const base =
      `${GUEST_API}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}` +
      (remote ? '&f_WT=2' : '');

    const byUrl = new Map<string, LinkedInCard>();

    try {
      await this.fetcher.withPage(async (page) => {
        let start = 0;
        for (let i = 0; i < LinkedInStrategy.MAX_PAGES; i++) {
          await page.goto(`${base}&start=${start}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.waitForTimeout(700);

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
          start += cards.length;
        }
      });
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    const cards = [...byUrl.values()];
    this.logger.log(`"${query}" → ${cards.length} offers (remote=${remote})`);

    return cards.map((c) => ({
      externalId: c.url,
      title: c.title || 'Untitled',
      company: c.company || 'Unknown',
      sourceUrl: c.url,
      meta: c,
    }));
  }

  /**
   * The card has title/company/location; the full description comes from the
   * guest job-posting endpoint (a plain HTML fragment, no login needed).
   */
  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const c = stub.meta as LinkedInCard | undefined;

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      location: c?.location || null,
      remoteTypes: [/remote|zdaln/i.test(c?.location ?? '') ? RemoteType.REMOTE : RemoteType.ONSITE],
      levels: [],
      techStack: [],
      description: (await this.fetchDescription(c?.url)) ?? undefined,
      language: Language.EN,
      publishedDate: c?.date ? new Date(c.date) : null,
    };
  }

  /** Pull the description HTML fragment from the guest job-posting endpoint. */
  private async fetchDescription(url?: string): Promise<string | null> {
    const id = (url ?? '').match(/-(\d{6,})(?:\?|$)/)?.[1] ?? (url ?? '').match(/(\d{6,})/)?.[1];
    if (!id) {
      return null;
    }
    try {
      const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return null;
      }
      const html = await res.text();
      const m = html.match(/class="[^"]*(?:show-more-less-html__markup|description__text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      return this.htmlToText(m?.[1]);
    } catch {
      return null;
    }
  }

  private htmlToText(html?: string | null): string | null {
    if (!html) {
      return null;
    }
    const text = html
      .replace(/<\/(p|li|h[1-6]|div|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
    return text || null;
  }

  private extractCards(page: import('playwright-core').Page): Promise<LinkedInCard[]> {
    return page.evaluate(() => {
      const norm = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
      return Array.from(document.querySelectorAll('li')).map((li) => {
        const link = li.querySelector('a[href*="/jobs/view/"]') as HTMLAnchorElement | null;
        return {
          title: norm(li.querySelector('h3')?.textContent),
          company: norm(li.querySelector('h4 a, .base-search-card__subtitle')?.textContent),
          location: norm(li.querySelector('.job-search-card__location')?.textContent),
          url: link?.href.split('?')[0] ?? '',
          date: li.querySelector('time')?.getAttribute('datetime') ?? '',
        };
      }).filter((c) => c.url);
    });
  }
}

// ── Shape of the data we pull out of each guest card ───────────
interface LinkedInCard {
  title: string;
  company: string;
  location: string;
  url: string;
  date: string;
}
