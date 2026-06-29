import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PublicStats, StatsService } from './stats.service';

@ApiTags('public')
@Controller('public')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('stats')
  public getStats(): Promise<PublicStats> {
    return this.stats.publicStats();
  }
}
