import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { Project } from '../projects/project.entity';
import { Recruitment } from '../recruitment/recruitment.entity';

import { MetricSample } from './metric-sample.entity';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoredService } from './service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonitoredService, MetricSample, Project, JobOffer, Recruitment]),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
