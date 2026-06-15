import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecruitmentController } from './recruitment.controller';
import { Recruitment } from './recruitment.entity';
import { RecruitmentService } from './recruitment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recruitment])],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
