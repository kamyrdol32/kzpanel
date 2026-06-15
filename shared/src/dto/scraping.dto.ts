import { JobSource, RemoteType } from '../enums';

import { BaseEntityDto } from './common.dto';

/** A saved scraping target — what to search, where, on which portal. */
export interface ScrapeTargetDto extends BaseEntityDto {
  source: JobSource;
  query: string;
  location: string | null;
  remoteType: RemoteType | null;
  enabled: boolean;
  lastRunAt: string | null;
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
