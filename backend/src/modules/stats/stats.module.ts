import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { ScrapeTarget } from '../scrape-targets/scrape-target.entity';

import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobOffer, ScrapeTarget])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
