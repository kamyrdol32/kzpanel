import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from './common/audit/audit.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { dataSourceOptions } from './database/data-source';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { ScrapeTargetsModule } from './modules/scrape-targets/scrape-targets.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['../.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({ ...dataSourceOptions, autoLoadEntities: true }),
    }),
    ScheduleModule.forRoot(),
    // cross-cutting
    AuditModule,
    HealthModule,
    // domain
    UsersModule,
    AuthModule,
    ProjectsModule,
    RecruitmentModule,
    JobsModule,
    MonitoringModule,
    NotificationsModule,
    ScrapeTargetsModule,
  ],
})
export class AppModule {}
