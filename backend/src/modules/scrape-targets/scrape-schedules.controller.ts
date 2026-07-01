import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload, Permission } from '../../shared';

import { CreateScrapeScheduleDto, UpdateScrapeScheduleDto } from './dto/scrape-schedule.dto';
import { ScrapeSchedulesService } from './scrape-schedules.service';
import { ScrapeTargetsService } from './scrape-targets.service';

@ApiTags('scrape-schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('scrape-targets/:targetId/schedules')
export class ScrapeSchedulesController {
  public constructor(
    private readonly schedules: ScrapeSchedulesService,
    private readonly targets: ScrapeTargetsService,
  ) {}

  @Get()
  public async findAll(@Param('targetId') targetId: string, @CurrentUser() user: JwtPayload) {
    await this.targets.findOneForUser(targetId, user.sub, user.role);
    return this.schedules.findAllForTarget(targetId);
  }

  @Post()
  @RequirePermissions(Permission.SCRAPE_SCHEDULE_MANAGE)
  public async create(
    @Param('targetId') targetId: string,
    @Body() dto: CreateScrapeScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.targets.findOneForUser(targetId, user.sub, user.role);
    return this.schedules.create(targetId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.SCRAPE_SCHEDULE_MANAGE)
  public async update(
    @Param('targetId') targetId: string,
    @Param('id') id: string,
    @Body() dto: UpdateScrapeScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.targets.findOneForUser(targetId, user.sub, user.role);
    return this.schedules.update(id, targetId, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.SCRAPE_SCHEDULE_MANAGE)
  public async remove(
    @Param('targetId') targetId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.targets.findOneForUser(targetId, user.sub, user.role);
    await this.schedules.remove(id, targetId);
  }
}
