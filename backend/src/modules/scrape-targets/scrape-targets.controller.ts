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
import { ScrapeQueueService } from './scrape-queue.service';
import { ScrapeTargetsService } from './scrape-targets.service';

@ApiTags('scrape-targets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scrape-targets')
export class ScrapeTargetsController {
  constructor(
    private readonly targets: ScrapeTargetsService,
    private readonly queue: ScrapeQueueService,
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

  @Post('run')
  @HttpCode(200)
  runAll() {
    return this.queue.enqueue();
  }

  @Post(':id/run')
  @HttpCode(200)
  async runOne(@Param('id') id: string) {
    await this.targets.findOne(id);
    return this.queue.enqueue(id);
  }
}
