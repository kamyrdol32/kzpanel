import { JobLevel, JobSource, Language, RemoteType } from '../enums';

import { BaseEntityDto } from './common.dto';

export interface ScrapeTargetDto extends BaseEntityDto {
  source: JobSource;
  query: string;
  location: string | null;
  remoteType: RemoteType | null;
  includeAllRemote: boolean;
  enabled: boolean;
  lastRunAt: string | null;
  offerCount: number;
  pendingCount: number;
  userId: string;
  ownerUsername?: string;
}

export interface CreateScrapeTargetRequest {
  source: JobSource;
  query: string;
  location?: string;
  remoteType?: RemoteType;
  includeAllRemote?: boolean;
  enabled?: boolean;
}

export type UpdateScrapeTargetRequest = Partial<CreateScrapeTargetRequest>;

export interface ScrapeRunResult {
  targetsProcessed: number;
  offersUpserted: number;
}

export interface ScrapeRequest {
  source: JobSource;
  query?: string;
  location?: string;
  remoteType?: RemoteType;
  limit?: number;
}

export interface ScrapedOfferDto {
  title: string;
  company: string;
  sourceUrl: string;
  source: JobSource;
  description?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  salaryRaw?: string | null;
  location?: string | null;
  remoteTypes?: RemoteType[];
  levels?: JobLevel[];
  employmentTypes?: string[];
  techStack?: string[];
  requirements?: string[];
  mustHave?: string[];
  niceToHave?: string[];
  benefits?: string[];
  responsibilities?: string[];
  language?: Language;
  publishedDate?: string | null;
}
