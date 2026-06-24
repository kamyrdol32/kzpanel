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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../shared';

import { CreateRecruitmentDto, UpdateRecruitmentDto } from './dto/recruitment.dto';
import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitment: RecruitmentService) {}

  @Get() findAll(@CurrentUser() user: JwtPayload) {
    return this.recruitment.findAll(user);
  }

  @Get(':id') findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.recruitment.findOne(id, user);
  }

  @Post() create(@Body() dto: CreateRecruitmentDto, @CurrentUser() user: JwtPayload) {
    return this.recruitment.create(dto, user);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateRecruitmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.update(id, dto, user);
  }

  @Delete(':id') remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.recruitment.remove(id, user);
  }
}
