import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ScrapeParams } from './scrape-params';

/** Typed access to scraper-related environment configuration. */
@Injectable()
export class ScraperConfig {
  constructor(private readonly config: ConfigService) {}

  /** Master switch — set SCRAPER_ENABLED=false to disable the daily scheduler. */
  get enabled(): boolean {
    return this.config.get('SCRAPER_ENABLED') !== 'false';
  }

  /** Daily cron. Default = 04:00 (6-field: sec min hour * * *). */
  get cron(): string {
    return this.config.get<string>('SCRAPER_INTERVAL_CRON') ?? '0 0 4 * * *';
  }

  /** Generate a synthetic offer instead of hitting the live portal (testing). */
  get mock(): boolean {
    return this.config.get('SCRAPER_MOCK') === 'true';
  }

  /** Shared secret guarding the internal /scrape/run endpoint. */
  get internalToken(): string {
    return this.config.get<string>('INTERNAL_API_TOKEN') ?? '';
  }

  /** HTTP port for the internal trigger endpoint. */
  get port(): number {
    return parseInt(this.config.get<string>('SCRAPER_PORT') ?? '3100', 10);
  }

  /** Default search params (only the limit is global; query/location come from targets). */
  get params(): ScrapeParams {
    return { limit: parseInt(this.config.get<string>('SCRAPER_LIMIT') ?? '20', 10) };
  }
}
