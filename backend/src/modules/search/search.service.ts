import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { Recruitment } from '../recruitment/recruitment.entity';
import { ScrapeTarget } from '../scrape-targets/scrape-target.entity';

const LIMIT = 15;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(Recruitment)
    private readonly recruitments: Repository<Recruitment>,
    @InjectRepository(ScrapeTarget)
    private readonly targets: Repository<ScrapeTarget>,
  ) {}

  async search(q: string, userId: string): Promise<{ jobs: JobOffer[]; recruitments: Recruitment[] }> {
    const term = `%${q}%`;

    const userTargetIds = await this.targets
      .createQueryBuilder('t')
      .select('t.id')
      .where('t.userId = :userId', { userId })
      .getMany()
      .then((rows) => rows.map((r) => r.id));

    const jobs =
      userTargetIds.length === 0
        ? []
        : await this.offers
            .createQueryBuilder('o')
            .where('o.scrapeTargetId IN (:...ids)', { ids: userTargetIds })
            .andWhere('(o.company ILIKE :term OR o.title ILIKE :term)', { term })
            .orderBy('o.publishedDate', 'DESC', 'NULLS LAST')
            .limit(LIMIT)
            .getMany();

    const recruitments = await this.recruitments
      .createQueryBuilder('r')
      .where('(r.company ILIKE :term OR r.position ILIKE :term)', { term })
      .orderBy('r.appliedAt', 'DESC', 'NULLS LAST')
      .limit(LIMIT)
      .getMany();

    return { jobs, recruitments };
  }
}
