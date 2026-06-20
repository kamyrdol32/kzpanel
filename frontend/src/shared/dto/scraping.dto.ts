import { JobLevel, JobSource, Language, RemoteType } from '../enums';

import { BaseEntityDto } from './common.dto';

/** A saved scraping target — what to search, where, on which portal. */
export interface ScrapeTargetDto extends BaseEntityDto {
  source: JobSource;
  query: string;
  location: string | null;
  remoteType: RemoteType | null;
  enabled: boolean;
  lastRunAt: string | null;
  offerCount: number;
  /** Owner account id. */
  userId: string;
  /** Owner username — only populated in the admin "others" listing. */
  ownerUsername?: string;
}

export interface CreateScrapeTargetRequest {
  source: JobSource;
  query: string;
  location?: string;
  remoteType?: RemoteType;
  enabled?: boolean;
}

export type UpdateScrapeTargetRequest = Partial<CreateScrapeTargetRequest>;

/** Result returned by a "scrape now" trigger. */
export interface ScrapeRunResult {
  targetsProcessed: number;
  offersUpserted: number;
}

/**
 * Wire contract: backend → scraper. The scraper is a thin, stateless worker —
 * it receives one request, runs the matching portal strategy, and returns RAW
 * offers. All orchestration (targets, cron, dedup, persistence) lives in the
 * backend.
 */
export interface ScrapeRequest {
  source: JobSource;
  query?: string;
  location?: string;
  remoteType?: RemoteType;
  /** max listings to fetch */
  limit?: number;
}

/**
 * Wire contract: scraper → backend. A single normalized-but-unpersisted offer
 * as scraped from a portal. The backend parses salary, detects language,
 * deduplicates and persists it. `publishedDate` is an ISO string over the wire.
 */
export interface ScrapedOfferDto {
  title: string;
  company: string;
  sourceUrl: string;
  source: JobSource;
  description?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  /** raw salary text e.g. "18 000 - 24 000 PLN"; parsed by the backend */
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
