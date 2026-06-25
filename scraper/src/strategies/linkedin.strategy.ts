import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const GUEST_API = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

const PL_TO_EN_CITY: Record<string, string> = {
  warszawa: 'Warsaw, Poland',
  krakow: 'Krakow, Poland',
  wroclaw: 'Wroclaw, Poland',
  poznan: 'Poznan, Poland',
  gdansk: 'Gdansk, Poland',
  gdynia: 'Gdynia, Poland',
  lodz: 'Lodz, Poland',
  katowice: 'Katowice, Poland',
  szczecin: 'Szczecin, Poland',
  bydgoszcz: 'Bydgoszcz, Poland',
  lublin: 'Lublin, Poland',
  bialystok: 'Bialystok, Poland',
  rzeszow: 'Rzeszow, Poland',
  torun: 'Torun, Poland',
  kielce: 'Kielce, Poland',
  olsztyn: 'Olsztyn, Poland',
  gliwice: 'Gliwice, Poland',
  zabrze: 'Zabrze, Poland',
  bytom: 'Bytom, Poland',
  'bielsko-biala': 'Bielsko-Biala, Poland',
  czestochowa: 'Czestochowa, Poland',
  radom: 'Radom, Poland',
  sosnowiec: 'Sosnowiec, Poland',
  trojmiasto: 'Tri-City, Poland',
  trojcity: 'Tri-City, Poland',
};

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
}

function normalizeLinkedInCity(city: string): string {
  const trimmed = city.trim();
  const key = stripDiacritics(trimmed).toLowerCase();
  const mapped = PL_TO_EN_CITY[key];
  if (mapped) {
    return mapped;
  }
  if (trimmed && !trimmed.toLowerCase().includes('poland')) {
    return `${trimmed}, Poland`;
  }
  return trimmed;
}

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
    const location = normalizeLinkedInCity((params.location ?? '').trim() || 'Poland');

    const cityBase = `${GUEST_API}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    const remoteBase = `${GUEST_API}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent('Poland')}&f_WT=2`;

    const byUrl = new Map<string, LinkedInCard>();

    const crawl = async (page: import('playwright-core').Page, base: string, isRemoteCrawl: boolean): Promise<void> => {
      let start = 0;
      for (let i = 0; i < LinkedInStrategy.MAX_PAGES; i++) {
        await page.goto(`${base}&start=${start}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(700);

        const cards = await this.extractCards(page);
        if (cards.length === 0) {
          break;
        }

        let newOnPage = 0;
        for (const c of cards) {
          if (c.url) {
            if (isRemoteCrawl) {
              c.remote = true;
            }
            if (!byUrl.has(c.url)) {
              newOnPage++;
            }
            byUrl.set(c.url, c);
          }
        }

        if (newOnPage === 0) {
          break;
        }
        start += cards.length;
      }
    };

    try {
      await this.fetcher.withPage(async (page) => {
        await crawl(page, cityBase, false);
        await crawl(page, remoteBase, true);
      });
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    const cards = [...byUrl.values()];
    this.logger.log(`"${query}" → ${cards.length} offers (city=${location})`);

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
    const detail = await this.fetchJobDetail(c?.url);

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      location: c?.location || null,
      remoteTypes: [c?.remote ? RemoteType.REMOTE : RemoteType.ONSITE],
      levels: this.mapSeniority(detail.seniority),
      employmentTypes: this.mapEmploymentType(detail.employmentType),
      techStack: [],
      description: detail.description ?? undefined,
      language: Language.EN,
      publishedDate: c?.date ? new Date(c.date) : null,
    };
  }

  private mapSeniority(seniority: string | null): JobLevel[] {
    const s = (seniority ?? '').toLowerCase();
    if (s.includes('intern') || s.includes('entry')) {
      return [JobLevel.JUNIOR];
    }
    if (s.includes('associate') || s.includes('junior')) {
      return [JobLevel.JUNIOR];
    }
    if (s.includes('mid') || s.includes('senior')) {
      return [JobLevel.SENIOR];
    }
    if (s.includes('director') || s.includes('executive') || s.includes('lead')) {
      return [JobLevel.LEAD];
    }
    return [];
  }

  private mapEmploymentType(type: string | null): string[] {
    const t = (type ?? '').toLowerCase();
    if (t.includes('full')) {
      return ['PERMANENT'];
    }
    if (t.includes('contract')) {
      return ['B2B'];
    }
    if (t.includes('part')) {
      return ['OTHER'];
    }
    if (t.includes('intern')) {
      return ['OTHER'];
    }
    if (t.includes('temporary')) {
      return ['OTHER'];
    }
    return [];
  }

  private async fetchJobDetail(url?: string): Promise<{ description: string | null; employmentType: string | null; seniority: string | null }> {
    const empty = { description: null, employmentType: null, seniority: null };
    const id = (url ?? '').match(/-(\d{6,})(?:\?|$)/)?.[1] ?? (url ?? '').match(/(\d{6,})/)?.[1];
    if (!id) {
      return empty;
    }
    try {
      const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return empty;
      }
      const html = await res.text();

      const descMatch = html.match(/class="[^"]*(?:show-more-less-html__markup|description__text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const description = this.htmlToText(descMatch?.[1]);

      const criteria = new Map<string, string>();
      const criteriaRe = /<li class="description__job-criteria-item">([\s\S]*?)<\/li>/gi;
      let m: RegExpExecArray | null;
      while ((m = criteriaRe.exec(html)) !== null) {
        const label = m[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1].replace(/<[^>]+>/g, '').trim() ?? '';
        const value = m[1].match(/<span[^>]*criteria-text[^>]*>([\s\S]*?)<\/span>/i)?.[1].replace(/<[^>]+>/g, '').trim() ?? '';
        if (label && value) {
          criteria.set(label.toLowerCase(), value);
        }
      }

      return {
        description,
        employmentType: criteria.get('employment type') ?? null,
        seniority: criteria.get('seniority level') ?? null,
      };
    } catch {
      return empty;
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
  remote?: boolean;
}
