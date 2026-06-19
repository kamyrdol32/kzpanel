import { ScrapeParams } from '../config/scrape-params';

/**
 * Per-portal DOM extraction config. Each portal declares its own config inside
 * its own strategy file — there is no shared selector map. This pins, for one
 * site, where the offer cards live on the results page and where each field
 * lives on a detail page. Selectors must be validated against the live DOM.
 */
export interface SiteConfig {
  /** Resolve a possibly-relative href to an absolute URL. */
  origin: string;
  /** Builds the search results URL from query/location. */
  searchUrl: (params: ScrapeParams) => string;
  /** Selectors used on the results page. */
  list: {
    card: string; // repeated element, one per offer
    title: string; // relative to card
    company: string; // relative to card
    link: string; // relative to card; 'self' when the card itself is the <a>
  };
  /** Selectors used on a single offer detail page. */
  detail: {
    salary?: string;
    location?: string;
    techChip?: string; // repeated → array
    description?: string;
  };
}

export const enc = (s?: string): string => encodeURIComponent(s ?? '');
