import { JobSource } from '../shared';
import { Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';
import { PlaywrightFetcher } from '../playwright/playwright.fetcher';
import { SiteConfig } from '../playwright/site-config';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

/**
 * Base for DOM-scraped portals that follow the "one results page + per-card selectors" pattern.
 * Portals needing bespoke pagination logic implement JobScraperStrategy directly instead.
 */
export abstract class BasePortalStrategy implements JobScraperStrategy {
  abstract readonly source: JobSource;
  abstract readonly config: SiteConfig;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly fetcher: PlaywrightFetcher) {}

  fetchList(params: ScrapeParams): Promise<JobStub[]> {
    return this.fetcher.scrapeList(this.source, this.config, params);
  }

  fetchDetails(stub: JobStub): Promise<JobRaw> {
    return this.fetcher.scrapeDetails(this.source, this.config, stub);
  }
}
