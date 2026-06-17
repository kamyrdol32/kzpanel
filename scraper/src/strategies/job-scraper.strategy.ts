import { JobLevel, JobSource, Language, RemoteType } from '../shared';

import { ScrapeParams } from '../config/scrape-params';

/** Minimal listing item returned from a portal's list endpoint. */
export interface JobStub {
  externalId: string;
  title: string;
  company: string;
  sourceUrl: string;
  /** raw listing payload carried to fetchDetails (avoids re-fetching the list row) */
  meta?: unknown;
}

/** Normalized full offer produced after fetching details. */
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
  remoteType?: RemoteType;
  level?: JobLevel;
  techStack?: string[];
  requirements?: string[];
  mustHave?: string[];
  niceToHave?: string[];
  benefits?: string[];
  responsibilities?: string[];
  language?: Language;
  publishedDate?: Date | null;
  /** Raw salary text scraped from the page (e.g. "18 000 - 24 000 PLN"); parsed downstream. */
  salaryRaw?: string | null;
}

/**
 * Strategy contract — one implementation per job portal.
 * The pipeline iterates registered strategies, calling list → details.
 */
export interface JobScraperStrategy {
  readonly source: JobSource;
  fetchList(params: ScrapeParams): Promise<JobStub[]>;
  fetchDetails(stub: JobStub): Promise<JobRaw>;
}
