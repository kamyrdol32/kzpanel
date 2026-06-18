import { JobSource, Language } from '../shared';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Browser, BrowserContext, chromium } from 'playwright-core';

import { ScrapeParams } from '../config/scrape-params';
import { JobRaw, JobStub } from '../strategies/job-scraper.strategy';

import { SITE_SELECTORS } from './site-selectors';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

@Injectable()
export class PlaywrightFetcher implements OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightFetcher.name);
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;

    const proxyUrl = process.env.PROXY_URL;
    this.browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
      ...(proxyUrl ? { proxy: { server: proxyUrl } } : {}),
    });
    return this.browser;
  }

  private async newContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    const ctx = await browser.newContext({
      userAgent: randomUA(),
      viewport: { width: 1280 + Math.floor(Math.random() * 200), height: 800 + Math.floor(Math.random() * 200) },
      locale: 'pl-PL',
      extraHTTPHeaders: { 'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7' },
    });
    await ctx.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    return ctx;
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
  }

  async scrapeList(source: JobSource, params: ScrapeParams): Promise<JobStub[]> {
    const cfg = SITE_SELECTORS[source];
    if (!cfg) {
      this.logger.warn(`No Playwright selectors configured for ${source}`);
      return [];
    }

    let ctx: BrowserContext | undefined;
    try {
      ctx = await this.newContext();
      const page = await ctx.newPage();
      await page.goto(cfg.searchUrl(params), { waitUntil: 'domcontentloaded', timeout: 30_000 });

      await this.autoScroll(page);

      const cards = page.locator(cfg.list.card);
      const total = await cards.count();
      const stubs: JobStub[] = [];

      for (let i = 0; i < total; i++) {
        const card = cards.nth(i);
        const title = (await this.text(card, cfg.list.title)) ?? 'Untitled';
        const company = (await this.text(card, cfg.list.company)) ?? 'Unknown';
        const href =
          cfg.list.link === 'self'
            ? await card.getAttribute('href')
            : await card.locator(cfg.list.link).first().getAttribute('href');
        if (!href) continue;
        const sourceUrl = href.startsWith('http') ? href : `${cfg.origin}${href}`;
        stubs.push({ externalId: sourceUrl, title, company, sourceUrl });
      }
      this.logger.log(`${source}: extracted ${stubs.length} cards`);
      return stubs;
    } catch (err) {
      this.logger.warn(`${source} scrapeList failed: ${(err as Error).message}`);
      return [];
    } finally {
      await ctx?.close();
    }
  }

  async scrapeDetails(source: JobSource, stub: JobStub): Promise<JobRaw> {
    const cfg = SITE_SELECTORS[source];
    const base: JobRaw = {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source,
      techStack: [],
      language: Language.PL,
    };
    if (!cfg) return base;

    let ctx: BrowserContext | undefined;
    try {
      ctx = await this.newContext();
      const page = await ctx.newPage();
      await page.goto(stub.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(800 + Math.floor(Math.random() * 600));

      const { salary, location, techChip, description } = cfg.detail;
      const techStack = techChip
        ? (await page.locator(techChip).allTextContents()).map((t) => t.trim()).filter(Boolean)
        : [];

      return {
        ...base,
        salaryRaw: salary ? await this.pageText(page, salary) : undefined,
        location: location ? await this.pageText(page, location) : null,
        description: (description ? await this.pageText(page, description) : undefined) ?? undefined,
        techStack,
      };
    } catch (err) {
      this.logger.debug(`${source} scrapeDetails fallback: ${(err as Error).message}`);
      return base;
    } finally {
      await ctx?.close();
    }
  }

  private async autoScroll(page: import('playwright-core').Page): Promise<void> {
    try {
      let previousHeight = 0;
      let unchangedRounds = 0;

      while (unchangedRounds < 3) {
        const height: number = await page.evaluate(() => document.body.scrollHeight);
        if (height === previousHeight) {
          unchangedRounds++;
        } else {
          unchangedRounds = 0;
          previousHeight = height;
        }
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200);
      }
    } catch {
      // scroll errors are non-fatal
    }
  }

  private async text(scope: import('playwright-core').Locator, selector: string): Promise<string | null> {
    try {
      const el = scope.locator(selector).first();
      return (await el.textContent())?.trim() ?? null;
    } catch {
      return null;
    }
  }

  private async pageText(page: import('playwright-core').Page, selector: string): Promise<string | null> {
    try {
      return (await page.locator(selector).first().textContent())?.trim() ?? null;
    } catch {
      return null;
    }
  }
}
