import { JobSource } from '../shared';
import { Injectable } from '@nestjs/common';

import { PlaywrightFetcher } from '../playwright/playwright.fetcher';
import { SiteConfig, enc } from '../playwright/site-config';

import { BasePortalStrategy } from './base-portal.strategy';

@Injectable()
export class PracujPlStrategy extends BasePortalStrategy {
  readonly source = JobSource.PRACUJPL;

  readonly config: SiteConfig = {
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
  };

  constructor(fetcher: PlaywrightFetcher) {
    super(fetcher);
  }
}
