import { ScrapeRequest } from '../shared';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JobRaw } from '../strategies/job-scraper.strategy';
import { ScrapeService } from '../pipeline/scrape.service';

import { InternalTokenGuard } from './internal-token.guard';

@Controller('scrape')
@UseGuards(InternalTokenGuard)
export class ScrapeController {
  constructor(private readonly scraper: ScrapeService) {}

  @Post()
  scrape(@Body() body: ScrapeRequest): Promise<JobRaw[]> {
    return this.scraper.scrape(body);
  }
}
