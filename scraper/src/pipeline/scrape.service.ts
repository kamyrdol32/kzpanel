import { JobSource, ScrapeRequest } from '@evpanel/shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScraperConfig } from '../config/scraper.config';
import { ScrapeParams } from '../config/scrape-params';
import { JobRaw } from '../strategies/job-scraper.strategy';
import { StrategyRegistry } from '../strategies/strategy.registry';

/**
 * Thin, stateless scrape executor. Receives one request, runs the matching
 * portal strategy (list → details) and returns RAW offers. No DB, no cron, no
 * normalization — all of that is the backend's job. With SCRAPER_MOCK=true it
 * returns a single synthetic offer so the end-to-end path can be tested offline.
 */
@Injectable()
export class ScrapeService {
  private readonly logger = new Logger(ScrapeService.name);

  constructor(
    private readonly registry: StrategyRegistry,
    private readonly config: ScraperConfig,
  ) {}

  async scrape(req: ScrapeRequest): Promise<JobRaw[]> {
    const params: ScrapeParams = {
      query: req.query,
      location: req.location,
      remoteType: req.remoteType,
      limit: req.limit ?? this.config.params.limit,
    };

    if (this.config.mock) {
      this.logger.log(`Mock scrape for ${req.source} "${req.query ?? ''}"`);
      return [this.synthetic(req.source, params)];
    }

    const strategy = this.registry.get(req.source);
    if (!strategy) {
      this.logger.warn(`No strategy registered for ${req.source}`);
      return [];
    }

    const stubs = await strategy.fetchList(params);
    this.logger.log(`${req.source} "${req.query ?? ''}": ${stubs.length} listings`);

    const offers: JobRaw[] = [];
    for (const stub of stubs.slice(0, params.limit)) {
      offers.push(await strategy.fetchDetails(stub));
    }
    return offers;
  }

  private synthetic(source: JobSource, params: ScrapeParams): JobRaw {
    const q = params.query ?? 'Developer';
    return {
      title: `${q} Developer`,
      company: 'Mock Company',
      sourceUrl: `mock://${source}/${encodeURIComponent(q)}-${encodeURIComponent(params.location ?? 'any')}`,
      source,
      description: `Synthetic ${q} offer for testing the pipeline.`,
      location: params.location ?? null,
      techStack: [q],
    };
  }
}
