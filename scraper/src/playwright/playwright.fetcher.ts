import { JobSource, Language } from '../shared';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Browser, chromium } from 'playwright-core';

import { ScrapeParams } from '../config/scrape-params';
import { JobRaw, JobStub } from '../strategies/job-scraper.strategy';

import { SITE_SELECTORS } from './site-selectors';

/**
 * Headless-browser scraper using Playwright + a hardcoded per-site selector map
 * (site-selectors.ts). Launches the system Chromium (alpine: /usr/bin/chromium-browser).
 * Every step degrades gracefully: any failure logs and yields empty/minimal data,
 * so a broken selector or anti-bot page never crashes the worker.
 */
@Injectable()
export class PlaywrightFetcher implements OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightFetcher.name);
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    this.browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    return this.browser;
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
  }

  /** Step 1: open the search page and extract listing cards. */
  async scrapeList(source: JobSource, params: ScrapeParams): Promise<JobStub[]> {
    const cfg = SITE_SELECTORS[source];
    if (!cfg) {
      this.logger.warn(`No Playwright selectors configured for ${source}`);
      return [];
    }

    let page;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage({ userAgent: 'Mozilla/5.0 EvPanel-Scraper' });
      await page.goto(cfg.searchUrl(params), { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(1500);

      const cards = page.locator(cfg.list.card);
      const count = Math.min(await cards.count(), params.limit);
      const stubs: JobStub[] = [];

      for (let i = 0; i < count; i++) {
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
      await page?.close();
    }
  }

  /** Step 3: open one offer page and extract salary / location / tech / description. */
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

    let page;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage({ userAgent: 'Mozilla/5.0 EvPanel-Scraper' });
      await page.goto(stub.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(1000);

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
      await page?.close();
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
