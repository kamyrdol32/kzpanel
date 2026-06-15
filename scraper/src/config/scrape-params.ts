import { RemoteType } from '@evpanel/shared';

/** Search parameters passed to a strategy for a scrape run. */
export interface ScrapeParams {
  /** free-text query, e.g. "Angular" */
  query?: string;
  /** location filter, e.g. "Warszawa" or "Remote" */
  location?: string;
  /** work-mode filter from the target (used e.g. to keep only remote offers) */
  remoteType?: RemoteType;
  /** max listings to fetch */
  limit: number;
}
