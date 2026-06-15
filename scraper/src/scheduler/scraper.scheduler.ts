import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { ScraperConfig } from '../config/scraper.config';
import { ScrapePipeline } from '../pipeline/scrape.pipeline';

/**
 * Registers the daily cron (SCRAPER_INTERVAL_CRON, default 04:00) that scrapes
 * every enabled target from the DB. On-demand runs come through the HTTP trigger
 * (ScrapeController) instead. Disabled entirely when SCRAPER_ENABLED=false.
 */
@Injectable()
export class ScraperScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScraperScheduler.name);

  constructor(
    private readonly pipeline: ScrapePipeline,
    private readonly config: ScraperConfig,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.warn('Scraper disabled (SCRAPER_ENABLED=false)');
      return;
    }
    const job = new CronJob(this.config.cron, () => void this.run());
    this.schedulerRegistry.addCronJob('scrape', job);
    job.start();
    this.logger.log(`Daily scrape scheduled with cron "${this.config.cron}"`);
  }

  private async run(): Promise<void> {
    this.logger.log('Scheduled scrape started');
    const result = await this.pipeline.runTargets();
    this.logger.log(
      `Scheduled scrape finished — targets=${result.targetsProcessed} offers=${result.offersUpserted}`,
    );
  }
}
