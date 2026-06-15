import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobOffer } from './job-offer.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobOffer])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
