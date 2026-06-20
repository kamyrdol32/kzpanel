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
  // details
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  mustHave: string[];
  niceToHave: string[];
  benefits: string[];
  techStack: string[];
  /** the scrape target this offer was fetched from (null for manual entries) */
  scrapeTargetId: string | null;
  /** reviewed and marked as not interesting — hidden/greyed on the list */
  dismissed: boolean;
}

/** Partial update for an offer (e.g. mark as dismissed). */
export interface UpdateJobRequest {
  dismissed?: boolean;
}

export interface JobFilter {
  search?: string;
  source?: JobSource;
  level?: JobLevel;
  remoteType?: RemoteType;
  language?: Language;
  /** Restrict to offers found by a specific scrape target. */
  scrapeTargetId?: string;
}

/** Raw normalized offer produced by a scraper strategy before persistence. */
export interface JobRawDto {
  title: string;
  company: string;
  sourceUrl: string;
  source: JobSource;
  rawDescription?: string;
  techStack?: string[];
  language?: Language;
}
