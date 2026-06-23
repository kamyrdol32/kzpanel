import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { Recruitment } from '../recruitment/recruitment.entity';
import { ScrapeTarget } from '../scrape-targets/scrape-target.entity';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobOffer, Recruitment, ScrapeTarget])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
