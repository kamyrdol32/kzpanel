import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoring: MonitoringService) {}

  @Get('services')
  services() {
    return this.monitoring.findAllServices();
  }

  @Get('stats')
  stats() {
    return this.monitoring.getDashboardStats();
  }
}
