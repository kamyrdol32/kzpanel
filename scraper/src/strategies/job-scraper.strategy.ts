import { JobLevel, JobSource, Language, RemoteType } from '../shared';

import { ScrapeParams } from '../config/scrape-params';

export interface JobStub {
  externalId: string;
  title: string;
  company: string;
  sourceUrl: string;
  meta?: unknown;
}

export interface JobRaw {
  title: string;
  company: string;
  sourceUrl: string;
  source: JobSource;
  description?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
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
  publishedDate?: Date | null;
  salaryRaw?: string | null;
}

export interface JobScraperStrategy {
  readonly source: JobSource;
  fetchList(params: ScrapeParams): Promise<JobStub[]>;
  fetchDetails(stub: JobStub): Promise<JobRaw>;
}
