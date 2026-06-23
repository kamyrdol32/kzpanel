import { JobFilter, Role } from '../../shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScrapeTarget } from '../scrape-targets/scrape-target.entity';

import { UpdateJobDto } from './dto/update-job.dto';
import { JobOffer } from './job-offer.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(ScrapeTarget)
    private readonly targets: Repository<ScrapeTarget>,
  ) {}

  async findAll(filter: JobFilter, user: { sub: string; role: Role }): Promise<JobOffer[]> {
    // Offers are browsed per scraper; make sure the caller owns the one asked for.
    if (filter.scrapeTargetId) {
      const target = await this.targets.findOne({ where: { id: filter.scrapeTargetId } });
      if (!target) {
        throw new NotFoundException('Scrape target not found');
      }

      if (target.userId !== user.sub && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Not your scrape target');
      }
    }

    const qb = this.offers.createQueryBuilder('o');

    if (filter.search) {
      qb.andWhere('o.title ILIKE :search', { search: `%${filter.search}%` });
    }

    if (filter.source) {
      qb.andWhere('o.source = :source', { source: filter.source });
    }

    if (filter.language) {
      qb.andWhere('o.language = :language', { language: filter.language });
    }

    if (filter.scrapeTargetId) {
      qb.andWhere('o.scrapeTargetId = :scrapeTargetId', { scrapeTargetId: filter.scrapeTargetId });
    }
    // level / remoteType are arrays — match offers whose array contains the value
    if (filter.level) {
      qb.andWhere('o.levels @> :level::jsonb', { level: JSON.stringify([filter.level]) });
    }

    if (filter.remoteType) {
      qb.andWhere('o.remoteTypes @> :remoteType::jsonb', { remoteType: JSON.stringify([filter.remoteType]) });
    }

    return qb
      .orderBy('o.publishedDate', 'DESC', 'NULLS LAST')
      .addOrderBy('o.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<JobOffer> {
    const offer = await this.offers.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }
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
