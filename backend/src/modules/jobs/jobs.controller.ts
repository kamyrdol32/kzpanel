import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { JobQueryDto } from './dto/job-query.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  findAll(@Query() query: JobQueryDto) {
    return this.jobs.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobs.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobs.remove(id);
  }
}
