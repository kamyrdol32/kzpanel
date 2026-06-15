import { JobSource } from '@evpanel/shared';

import { ScrapeParams } from '../config/scrape-params';

/**
 * Hardcoded per-site extraction config. THIS is where you pin "on portal X the
 * salary lives in element with selector Y". Selectors below are starting points
 * and MUST be validated/tuned against the live DOM (sites change frequently).
 *
 * Use browser devtools on a real search page to confirm each selector.
 */
export interface SiteConfig {
  /** Builds the search results URL from query/location. */
  searchUrl: (params: ScrapeParams) => string;
  /** Selectors used on the results page. */
  list: {
    card: string; // repeated element, one per offer
    title: string; // relative to card
    company: string; // relative to card
    link: string; // relative to card; href is read
  };
  /** Selectors used on a single offer detail page. */
  detail: {
    salary?: string;
    location?: string;
    techChip?: string; // repeated → array
    description?: string;
  };
  /** Resolve a possibly-relative href to an absolute URL. */
  origin: string;
}

const enc = (s?: string): string => encodeURIComponent(s ?? '');

export const SITE_SELECTORS: Partial<Record<JobSource, SiteConfig>> = {
  // ── JustJoinIT ──────────────────────────────────────────────
  [JobSource.JUSTJOINIT]: {
    origin: 'https://justjoin.it',
    searchUrl: (p) => `https://justjoin.it/all-locations/${enc(p.query)}`,
    list: {
      card: '[data-test-id="virtuoso-item-list"] a, a.offer-card',
      title: 'h3, [data-test-id="offer-title"]',
      company: '[data-test-id="company-name"], .company-name',
      link: 'self', // the card itself is the <a>
    },
    detail: {
      salary: '[data-test-id="detail-salary"], .salary',
      location: '[data-test-id="detail-location"]',
      techChip: '[data-test-id="technologies-item"], .skill-tag',
      description: '.MuiBox-root .description, [data-test-id="offer-description"]',
    },
  },

  // ── PracujPl ────────────────────────────────────────────────
  [JobSource.PRACUJPL]: {
    origin: 'https://www.pracuj.pl',
    searchUrl: (p) =>
      `https://www.pracuj.pl/praca/${enc(p.query)};kw${p.location ? '/' + enc(p.location) + ';wp' : ''}`,
    list: {
      card: '[data-test="default-offer"], [data-test="section-offers"] li',
      title: '[data-test="offer-title"] a, h2 a',
      company: '[data-test="text-company-name"]',
      link: '[data-test="offer-title"] a, h2 a',
    },
    detail: {
      salary: '[data-test="text-earningAmount"], [data-test="section-salary"]',
      location: '[data-test="text-region"]',
      techChip: '[data-test="chip-technology"], [data-test="item-technologies-expected"] li',
      description: '[data-test="section-description"], [data-test="text-about-project"]',
    },
  },

  // ── BulldogJob ──────────────────────────────────────────────
  [JobSource.BULLDOGJOB]: {
    origin: 'https://bulldogjob.pl',
    searchUrl: (p) => `https://bulldogjob.pl/companies/jobs/s/role,${enc(p.query)}`,
    list: {
      card: 'a[href^="/companies/jobs/"]',
      title: 'h3, .font-extrabold',
      company: '.text-gray-400, [class*="company"]',
      link: 'self',
    },
    detail: {
      salary: '[class*="salary"], .text-green-600',
      location: '[class*="location"]',
      techChip: '[class*="tech"] span, .skills span',
      description: '#description, article',
    },
  },

  // ── LinkedIn (guest job search; often gated/anti-bot) ────────
  [JobSource.LINKEDIN]: {
    origin: 'https://www.linkedin.com',
    searchUrl: (p) =>
      `https://www.linkedin.com/jobs/search?keywords=${enc(p.query)}&location=${enc(p.location)}`,
    list: {
      card: 'ul.jobs-search__results-list li',
      title: 'h3.base-search-card__title',
      company: 'h4.base-search-card__subtitle a',
      link: 'a.base-card__full-link',
    },
    detail: {
      salary: '.compensation__salary',
      location: '.topcard__flavor--bullet',
      techChip: '.job-criteria__text',
      description: '.show-more-less-html__markup',
    },
  },
};
