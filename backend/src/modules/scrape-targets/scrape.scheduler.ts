import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { ScrapeQueueService } from './scrape-queue.service';

@Injectable()
export class ScrapeScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScrapeScheduler.name);

  constructor(
    private readonly queue: ScrapeQueueService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    if (this.config.get('SCRAPER_ENABLED') === 'false') {
      this.logger.warn('Scraper disabled (SCRAPER_ENABLED=false)');
      return;
    }
    const cron = this.config.get<string>('SCRAPER_INTERVAL_CRON') ?? '0 0 4 * * *';
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('scrape', job);
    job.start();
    this.logger.log(`Daily scrape scheduled with cron "${cron}"`);
  }

  private async run(): Promise<void> {
    this.logger.log('Scheduled scrape enqueued');
    const result = await this.queue.enqueue();
    this.logger.log(
      `Scheduled scrape finished — targets=${result.targetsProcessed} offers=${result.offersUpserted}`,
    );
  }
}
