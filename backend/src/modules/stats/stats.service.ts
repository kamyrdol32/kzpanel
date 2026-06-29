import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { ScrapeTarget } from '../scrape-targets/scrape-target.entity';

export interface PublicStats {
  scrapers: number;
  offers: number;
  companies: number;
  sources: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(ScrapeTarget)
    private readonly targets: Repository<ScrapeTarget>,
  ) {}

  public async publicStats(): Promise<PublicStats> {
    const offers = await this.offers.createQueryBuilder('o').getCount();
    const scrapers = await this.targets.createQueryBuilder('t').getCount();

    const companiesRow = await this.offers
      .createQueryBuilder('o')
      .select('COUNT(DISTINCT o.company)', 'count')
      .getRawOne<{ count: string }>();

    const sourcesRow = await this.offers
      .createQueryBuilder('o')
      .select('COUNT(DISTINCT o.source)', 'count')
      .getRawOne<{ count: string }>();

    return {
      scrapers,
      offers,
      companies: Number(companiesRow?.count ?? 0),
      sources: Number(sourcesRow?.count ?? 0),
    };
  }
}
