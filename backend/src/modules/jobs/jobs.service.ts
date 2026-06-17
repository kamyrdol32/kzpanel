import { JobFilter } from '../../shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { UpdateJobDto } from './dto/update-job.dto';
import { JobOffer } from './job-offer.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
  ) {}

  async findAll(filter: JobFilter): Promise<JobOffer[]> {
    return this.offers.find({
      where: {
        ...(filter.search ? { title: ILike(`%${filter.search}%`) } : {}),
        ...(filter.source ? { source: filter.source } : {}),
        ...(filter.level ? { level: filter.level } : {}),
        ...(filter.remoteType ? { remoteType: filter.remoteType } : {}),
        ...(filter.language ? { language: filter.language } : {}),
      },
      order: { publishedDate: 'DESC', createdAt: 'DESC' },
      take: 500,
    });
  }

  async findOne(id: string): Promise<JobOffer> {
    const offer = await this.offers.findOne({ where: { id } });
    if (!offer) throw new NotFoundException('Job offer not found');
    return offer;
  }

  async update(id: string, dto: UpdateJobDto): Promise<JobOffer> {
    await this.findOne(id);
    await this.offers.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.offers.softDelete(id); // soft delete (deletedAt)
  }
}
