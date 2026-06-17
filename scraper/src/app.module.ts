import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ScraperConfig } from './config/scraper.config';
import { InternalTokenGuard } from './http/internal-token.guard';
import { ScrapeController } from './http/scrape.controller';
import { ScrapeService } from './pipeline/scrape.service';
import { PlaywrightFetcher } from './playwright/playwright.fetcher';
import { BulldogJobStrategy } from './strategies/bulldogjob.strategy';
import { JustJoinITStrategy } from './strategies/justjoinit.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { NoFluffJobsStrategy } from './strategies/nofluffjobs.strategy';
import { PracujPlStrategy } from './strategies/pracujpl.strategy';
import { StrategyRegistry } from './strategies/strategy.registry';

/**
 * Stateless scraper worker: a single guarded endpoint (POST /scrape) backed by
 * Playwright + per-portal strategies. No database, no scheduler — orchestration
 * and persistence live in the backend.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] })],
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
    ScrapeService,
  ],
})
export class AppModule {}
