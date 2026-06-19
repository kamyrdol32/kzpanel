import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { JobOffer } from '../jobs/job-offer.entity';

import { CreateScrapeTargetDto, UpdateScrapeTargetDto } from './dto/scrape-target.dto';
import { ScrapeTarget } from './scrape-target.entity';

@Injectable()
export class ScrapeTargetsService {
  constructor(
    @InjectRepository(ScrapeTarget)
    private readonly repo: Repository<ScrapeTarget>,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
  ) {}

  async findAll(): Promise<Array<ScrapeTarget & { offerCount: number }>> {
    const targets = await this.repo.find({ order: { createdAt: 'DESC' } });

    const counts = await this.offers
      .createQueryBuilder('o')
      .select('o.scrapeTargetId', 'targetId')
      .addSelect('COUNT(*)', 'count')
      .where('o.scrapeTargetId IS NOT NULL')
      .andWhere('o.deletedAt IS NULL')
      .groupBy('o.scrapeTargetId')
      .getRawMany<{ targetId: string; count: string }>();

    const countByTarget = new Map(counts.map((c) => [c.targetId, Number(c.count)]));

    return targets.map((target) => ({
      ...target,
      offerCount: countByTarget.get(target.id) ?? 0,
    }));
  }

  async findOne(id: string): Promise<ScrapeTarget> {
    const target = await this.repo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('Scrape target not found');
    return target;
  }

  async create(dto: CreateScrapeTargetDto): Promise<ScrapeTarget> {
    try {
      return await this.repo.save(
        this.repo.create({ ...dto, location: dto.location ?? null }),
      );
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new BadRequestException('Identical scrape target already exists');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateScrapeTargetDto): Promise<ScrapeTarget> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  /** Removes the target AND hard-deletes every offer fetched from it. */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.offers.delete({ scrapeTargetId: id });
    await this.repo.softDelete(id);
  }
}
