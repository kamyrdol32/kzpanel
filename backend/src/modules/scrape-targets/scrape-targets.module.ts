import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Recruitment } from '../recruitment/recruitment.entity';
import { User } from '../users/user.entity';

import { LanguageDetector } from './language.detector';
import { ScrapeOrchestratorService } from './scrape-orchestrator.service';
import { ScrapeQueueService } from './scrape-queue.service';
import { ScrapeScheduler } from './scrape.scheduler';
import { ScrapeTarget } from './scrape-target.entity';
import { ScrapeTargetsController } from './scrape-targets.controller';
import { ScrapeTargetsService } from './scrape-targets.service';
import { ScraperClient } from './scraper-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeTarget, JobOffer, User, Recruitment]), NotificationsModule],
  controllers: [ScrapeTargetsController],
  providers: [
    ScrapeTargetsService,
    ScraperClient,
    LanguageDetector,
    ScrapeOrchestratorService,
    ScrapeQueueService,
    ScrapeScheduler,
  ],
  exports: [ScrapeTargetsService],
})
export class ScrapeTargetsModule {}
