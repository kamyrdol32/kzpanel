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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload, Role } from '../../shared';

import { CreateScrapeTargetDto, UpdateScrapeTargetDto } from './dto/scrape-target.dto';
import { ScrapeQueueService } from './scrape-queue.service';
import { ScrapeTargetsService } from './scrape-targets.service';

@ApiTags('scrape-targets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scrape-targets')
export class ScrapeTargetsController {
  constructor(
    private readonly targets: ScrapeTargetsService,
    private readonly queue: ScrapeQueueService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.targets.findAll(user.sub);
  }

  @Get('others')
  @Roles(Role.ADMIN)
  findOthers(@CurrentUser() user: JwtPayload) {
    return this.targets.findOthers(user.sub);
  }

  @Post()
  create(@Body() dto: CreateScrapeTargetDto, @CurrentUser() user: JwtPayload) {
    return this.targets.create(dto, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScrapeTargetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.targets.findOneForUser(id, user.sub, user.role);
    return this.targets.update(id, dto);
  }

  @Delete(':id/offers')
  async clearOffers(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.targets.findOneForUser(id, user.sub, user.role);
    return this.targets.clearOffers(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.targets.findOneForUser(id, user.sub, user.role);
    return this.targets.remove(id);
  }

  @Post('run')
  @HttpCode(200)
  runAll(@CurrentUser() user: JwtPayload) {
    return this.queue.enqueue({ userId: user.sub });
  }

  @Post(':id/run')
  @HttpCode(200)
  async runOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.targets.findOneForUser(id, user.sub, user.role);
    return this.queue.enqueue({ targetId: id });
  }
}
