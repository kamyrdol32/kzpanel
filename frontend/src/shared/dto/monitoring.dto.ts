import { ServiceStatus } from '../enums';

import { BaseEntityDto } from './common.dto';

export interface ServiceDto extends BaseEntityDto {
  name: string;
  status: ServiceStatus;
  uptime: number; // percentage 0-100
  responseTime: number | null; // ms
  cpu: number | null; // percentage
  ram: number | null; // percentage
  disk: number | null; // percentage
  target: string | null; // url or container name
  lastChecked: string | null;
}

export interface MetricSampleDto {
  serviceId: string;
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  responseTime: number | null;
  sampledAt: string;
}

export interface DashboardStatsDto {
  projects: number;
  jobOffers: number;
  applications: number;
  activeServices: number;
}
