import { JobSource } from '@evpanel/shared';
import { Injectable } from '@nestjs/common';

import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { BasePortalStrategy } from './base-portal.strategy';

@Injectable()
export class PracujPlStrategy extends BasePortalStrategy {
  readonly source = JobSource.PRACUJPL;
  constructor(fetcher: PlaywrightFetcher) {
    super(fetcher);
  }
}
