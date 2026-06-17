import { JobSource } from '../shared';
import { Injectable } from '@nestjs/common';

import { PlaywrightFetcher } from '../playwright/playwright.fetcher';

import { BasePortalStrategy } from './base-portal.strategy';

@Injectable()
export class BulldogJobStrategy extends BasePortalStrategy {
  readonly source = JobSource.BULLDOGJOB;
  constructor(fetcher: PlaywrightFetcher) {
    super(fetcher);
  }
}
