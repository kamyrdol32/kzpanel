import { ServiceStatus } from '../../shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MonitoringService } from '../monitoring/monitoring.service';

import { ProjectsService } from './projects.service';

/**
 * Periodically pings each project's HTTP health endpoint and updates the
 * corresponding monitored service status + response time.
 */
@Injectable()
export class ProjectHealthPoller {
  private readonly logger = new Logger(ProjectHealthPoller.name);

  constructor(
    private readonly projects: ProjectsService,
    private readonly monitoring: MonitoringService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pollAll(): Promise<void> {
    const projects = await this.projects.findWithHealthEndpoint();
    await Promise.allSettled(projects.map((p) => this.pollOne(p.name, p.healthEndpoint!)));
  }

  private async pollOne(name: string, url: string): Promise<void> {
    const startedAt = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const responseTime = Date.now() - startedAt;
      await this.monitoring.upsertStatus(name, {
        status: res.ok ? ServiceStatus.ONLINE : ServiceStatus.OFFLINE,
        responseTime,
        target: url,
      });
    } catch (err) {
      this.logger.warn(`Health check failed for ${name}: ${(err as Error).message}`);
      await this.monitoring.upsertStatus(name, {
        status: ServiceStatus.OFFLINE,
        responseTime: null,
        target: url,
      });
    }
  }
}
