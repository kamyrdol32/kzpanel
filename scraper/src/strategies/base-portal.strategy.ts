import { JobSource } from '../shared';
import { Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

/**
 * Shared base for DOM-scraped portals. Delegates to the Playwright fetcher, which
 * uses the hardcoded per-site selector map (site-selectors.ts). Concrete portals
 * only declare their `source`.
 */
export abstract class BasePortalStrategy implements JobScraperStrategy {
  abstract readonly source: JobSource;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly fetcher: PlaywrightFetcher) {}

  fetchList(params: ScrapeParams): Promise<JobStub[]> {
    return this.fetcher.scrapeList(this.source, params);
  }

  fetchDetails(stub: JobStub): Promise<JobRaw> {
    return this.fetcher.scrapeDetails(this.source, stub);
  }
}
