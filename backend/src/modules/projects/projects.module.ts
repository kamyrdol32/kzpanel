import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MonitoringModule } from '../monitoring/monitoring.module';

import { DeploymentHistory } from './deployment-history.entity';
import { ProjectHealthPoller } from './project-health.poller';
import { Project } from './project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, DeploymentHistory]), MonitoringModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectHealthPoller],
  exports: [ProjectsService],
})
export class ProjectsModule {}
