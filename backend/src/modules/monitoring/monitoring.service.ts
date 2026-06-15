import { DashboardStatsDto, ServiceStatus } from '@evpanel/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { Project } from '../projects/project.entity';
import { Recruitment } from '../recruitment/recruitment.entity';

import { MetricSample } from './metric-sample.entity';
import { MonitoredService } from './service.entity';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(MonitoredService)
    private readonly services: Repository<MonitoredService>,
    @InjectRepository(MetricSample)
    private readonly samples: Repository<MetricSample>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(Recruitment)
    private readonly recruitments: Repository<Recruitment>,
  ) {}

  findAllServices(): Promise<MonitoredService[]> {
    return this.services.find({ order: { name: 'ASC' } });
  }

  /** Aggregated counters for the dashboard header. */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [projects, jobOffers, applications, activeServices] = await Promise.all([
      this.projects.count(),
      this.offers.count(),
      this.recruitments.count(),
      this.services.count({ where: { status: ServiceStatus.ONLINE } }),
    ]);
    return { projects, jobOffers, applications, activeServices };
  }

  /** Creates/updates a service by name and records a metric sample. */
  async upsertStatus(
    name: string,
    data: Partial<Pick<MonitoredService, 'status' | 'responseTime' | 'cpu' | 'ram' | 'disk' | 'target'>>,
  ): Promise<void> {
    let service = await this.services.findOne({ where: { name } });
    if (!service) {
      service = this.services.create({ name });
    }
    Object.assign(service, data, { lastChecked: new Date() });
    await this.services.save(service);

    await this.samples.insert({
      serviceId: service.id,
      cpu: data.cpu ?? null,
      ram: data.ram ?? null,
      disk: data.disk ?? null,
      responseTime: data.responseTime ?? null,
      sampledAt: new Date(),
    });
  }
}
