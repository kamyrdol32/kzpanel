import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { CreateRecruitmentDto, UpdateRecruitmentDto } from './dto/recruitment.dto';
import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitment: RecruitmentService) {}

  @Get() findAll() {
    return this.recruitment.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.recruitment.findOne(id);
  }

  @Post() create(@Body() dto: CreateRecruitmentDto) {
    return this.recruitment.create(dto);
  }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateRecruitmentDto) {
    return this.recruitment.update(id, dto);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.recruitment.remove(id);
  }
}
