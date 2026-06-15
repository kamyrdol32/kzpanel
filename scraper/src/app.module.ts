import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScraperConfig } from './config/scraper.config';
import { InternalTokenGuard } from './http/internal-token.guard';
import { ScrapeController } from './http/scrape.controller';
import { JobOffer } from './persistence/job-offer.entity';
import { ScrapeTarget } from './persistence/scrape-target.entity';
import { PlaywrightFetcher } from './playwright/playwright.fetcher';
import { LanguageDetector } from './pipeline/language.detector';
import { ScrapePipeline } from './pipeline/scrape.pipeline';
import { ScraperScheduler } from './scheduler/scraper.scheduler';
import { BulldogJobStrategy } from './strategies/bulldogjob.strategy';
import { JustJoinITStrategy } from './strategies/justjoinit.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { NoFluffJobsStrategy } from './strategies/nofluffjobs.strategy';
import { PracujPlStrategy } from './strategies/pracujpl.strategy';
import { StrategyRegistry } from './strategies/strategy.registry';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      username: process.env.POSTGRES_USER ?? 'evpanel',
      password: process.env.POSTGRES_PASSWORD ?? 'evpanel',
      database: process.env.POSTGRES_DB ?? 'evpanel',
      entities: [JobOffer, ScrapeTarget],
      synchronize: false, // backend owns the schema/migrations
    }),
    TypeOrmModule.forFeature([JobOffer, ScrapeTarget]),
  ],
  controllers: [ScrapeController],
  providers: [
    ScraperConfig,
    InternalTokenGuard,
    PlaywrightFetcher,
    StrategyRegistry,
    NoFluffJobsStrategy,
    JustJoinITStrategy,
    LinkedInStrategy,
    BulldogJobStrategy,
    PracujPlStrategy,
    LanguageDetector,
    ScrapePipeline,
    ScraperScheduler,
  ],
})
export class AppModule {}
