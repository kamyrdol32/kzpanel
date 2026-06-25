import { JobLevel, JobSource, Language, RemoteType } from '../enums';

import { BaseEntityDto } from './common.dto';

export interface JobOfferDto extends BaseEntityDto {
  title: string;
  company: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  location: string | null;
  remoteTypes: RemoteType[];
  levels: JobLevel[];
  employmentTypes: string[];
  language: Language;
  source: JobSource;
  sourceUrl: string;
  publishedDate: string | null;
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  mustHave: string[];
  niceToHave: string[];
  benefits: string[];
  techStack: string[];
  scrapeTargetId: string | null;
  dismissed: boolean;
  staleAt: string | null;
}

export interface UpdateJobRequest {
  dismissed?: boolean;
}

export interface JobFilter {
  search?: string;
  source?: JobSource;
  level?: JobLevel;
  remoteType?: RemoteType;
  language?: Language;
  scrapeTargetId?: string;
}

export interface JobRawDto {
  title: string;
  company: string;
  sourceUrl: string;
  source: JobSource;
  rawDescription?: string;
  techStack?: string[];
  language?: Language;
}
