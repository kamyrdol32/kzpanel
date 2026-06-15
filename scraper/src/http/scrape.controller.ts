import { ScrapeRunResult } from '@evpanel/shared';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { ScrapePipeline } from '../pipeline/scrape.pipeline';

import { InternalTokenGuard } from './internal-token.guard';

interface RunBody {
  targetId?: string;
}

/** Internal HTTP trigger used by the backend "Scrape now" button. */
@Controller('scrape')
@UseGuards(InternalTokenGuard)
export class ScrapeController {
  constructor(private readonly pipeline: ScrapePipeline) {}

  @Post('run')
  run(@Body() body: RunBody): Promise<ScrapeRunResult> {
    return this.pipeline.runTargets(body?.targetId);
  }
}
