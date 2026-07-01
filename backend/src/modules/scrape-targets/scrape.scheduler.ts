import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ScrapeQueueService } from './scrape-queue.service';
import { ScrapeSchedulesService } from './scrape-schedules.service';

@Injectable()
export class ScrapeScheduler {
  private readonly logger = new Logger(ScrapeScheduler.name);

  public constructor(
    private readonly queue: ScrapeQueueService,
    private readonly config: ConfigService,
    private readonly schedules: ScrapeSchedulesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async handleTick(): Promise<void> {
    if (this.config.get('SCRAPER_ENABLED') === 'false') {
      return;
    }

    const now = new Date();
    const weekday = now.getUTCDay();
    const dayOfMonth = now.getUTCDate();
    const hhmm = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

    const due = await this.schedules.findDueSchedules(weekday, dayOfMonth, hhmm);
    if (due.length === 0) {
      return;
    }

    this.logger.log(`${due.length} scheduled scrape(s) due at ${hhmm} UTC`);
    for (const schedule of due) {
      void this.queue.enqueue({ targetId: schedule.scrapeTargetId });
    }
  }
}
