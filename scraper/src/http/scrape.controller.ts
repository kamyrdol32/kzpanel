import { ScrapeRequest } from '@evpanel/shared';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JobRaw } from '../strategies/job-scraper.strategy';
import { ScrapeService } from '../pipeline/scrape.service';

import { InternalTokenGuard } from './internal-token.guard';

/**
 * Internal HTTP endpoint the backend calls to run one scrape. Returns RAW
 * offers; the backend normalizes, deduplicates and persists them.
 * Reachable only on the internal network (guarded by a shared token).
 */
@Controller('scrape')
@UseGuards(InternalTokenGuard)
export class ScrapeController {
  constructor(private readonly scraper: ScrapeService) {}

  @Post()
  scrape(@Body() body: ScrapeRequest): Promise<JobRaw[]> {
    return this.scraper.scrape(body);
  }
}
