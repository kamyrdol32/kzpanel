import { ScrapeParams } from '../config/scrape-params';

export interface SiteConfig {
  origin: string;
  searchUrl: (params: ScrapeParams) => string;
  list: {
    card: string;
    title: string;
    company: string;
    link: string;
  };
  detail: {
    salary?: string;
    location?: string;
    techChip?: string;
    description?: string;
  };
}

export const enc = (s?: string): string => encodeURIComponent(s ?? '');
