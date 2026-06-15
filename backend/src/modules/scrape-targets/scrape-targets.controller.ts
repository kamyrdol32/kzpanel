import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { CreateScrapeTargetDto, UpdateScrapeTargetDto } from './dto/scrape-target.dto';
import { ScrapeOrchestratorService } from './scrape-orchestrator.service';
import { ScrapeTargetsService } from './scrape-targets.service';

@ApiTags('scrape-targets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scrape-targets')
export class ScrapeTargetsController {
  constructor(
    private readonly targets: ScrapeTargetsService,
    private readonly orchestrator: ScrapeOrchestratorService,
  ) {}

  @Get()
  findAll() {
    return this.targets.findAll();
  }

  @Post()
  create(@Body() dto: CreateScrapeTargetDto) {
    return this.targets.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScrapeTargetDto) {
    return this.targets.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.targets.remove(id);
  }

  /** Trigger an immediate scrape of all enabled targets ("Scrapuj teraz"). */
  @Post('run')
  @HttpCode(200)
  runAll() {
    return this.orchestrator.runTargets();
  }

  /** Trigger an immediate scrape of a single target. */
  @Post(':id/run')
  @HttpCode(200)
  async runOne(@Param('id') id: string) {
    await this.targets.findOne(id); // 404 if missing
    return this.orchestrator.runTargets(id);
  }
}
