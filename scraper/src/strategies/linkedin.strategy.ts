import { JobSource } from '../shared';
import { Injectable } from '@nestjs/common';

import { PlaywrightFetcher } from '../playwright/playwright.fetcher';
import { SiteConfig, enc } from '../playwright/site-config';

import { BasePortalStrategy } from './base-portal.strategy';

@Injectable()
export class LinkedInStrategy extends BasePortalStrategy {
  readonly source = JobSource.LINKEDIN;

  readonly config: SiteConfig = {
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
  };

  constructor(fetcher: PlaywrightFetcher) {
    super(fetcher);
  }
}
