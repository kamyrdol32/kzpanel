import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOffer } from '../jobs/job-offer.entity';

import { ScrapeTarget } from './scrape-target.entity';
import { ScrapeTargetsController } from './scrape-targets.controller';
import { ScrapeTargetsService } from './scrape-targets.service';
import { ScraperClient } from './scraper-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeTarget, JobOffer])],
  controllers: [ScrapeTargetsController],
  providers: [ScrapeTargetsService, ScraperClient],
  exports: [ScrapeTargetsService],
})
export class ScrapeTargetsModule {}
