import { RemoteType } from '../shared';

export interface ScrapeParams {
  query?: string;
  location?: string;
  remoteType?: RemoteType;
  includeAllRemote?: boolean;
  limit?: number;
}
