import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, QueryFailedError, Repository } from 'typeorm';

import { Role } from '../../shared';
import { JobOffer } from '../jobs/job-offer.entity';
import { Recruitment } from '../recruitment/recruitment.entity';
import { User } from '../users/user.entity';

import { CreateScrapeTargetDto, UpdateScrapeTargetDto } from './dto/scrape-target.dto';
import { ScrapeTarget } from './scrape-target.entity';

type ScrapeTargetWithCount = ScrapeTarget & {
  offerCount: number;
  pendingCount: number;
  ownerUsername?: string;
};

@Injectable()
export class ScrapeTargetsService {
  constructor(
    @InjectRepository(ScrapeTarget)
    private readonly repo: Repository<ScrapeTarget>,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Recruitment)
    private readonly recruitments: Repository<Recruitment>,
  ) {}

  async findAll(userId: string): Promise<ScrapeTargetWithCount[]> {
    const targets = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return this.withOfferCounts(targets, userId);
  }

  async findOthers(userId: string): Promise<ScrapeTargetWithCount[]> {
    const targets = await this.repo.find({
      where: { userId: Not(userId) },
      order: { createdAt: 'DESC' },
    });
    const withCounts = await this.withOfferCounts(targets, userId);

    const ownerIds = [...new Set(targets.map((t) => t.userId))];
    if (ownerIds.length === 0) {
      return withCounts;
    }
    const owners = await this.users.find({ where: { id: In(ownerIds) } });
    const usernameById = new Map(owners.map((u) => [u.id, u.username]));

    return withCounts.map((t) => ({ ...t, ownerUsername: usernameById.get(t.userId) }));
  }

  async findOne(id: string): Promise<ScrapeTarget> {
    const target = await this.repo.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('Scrape target not found');
    }
    return target;
  }

  async findOneForUser(id: string, userId: string, role: Role): Promise<ScrapeTarget> {
    const target = await this.findOne(id);
    if (target.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('Not your scrape target');
    }
    return target;
  }

  async create(dto: CreateScrapeTargetDto, userId: string): Promise<ScrapeTarget> {
    try {
      return await this.repo.save(
        this.repo.create({ ...dto, location: dto.location ?? null, userId }),
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

  async clearOffers(id: string): Promise<{ deleted: number }> {
    await this.findOne(id);
    const result = await this.offers
      .createQueryBuilder()
      .delete()
      .from(JobOffer)
      .where('scrapeTargetId = :id', { id })
      .execute();
    return { deleted: result.affected ?? 0 };
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.offers.delete({ scrapeTargetId: id });
    await this.repo.softDelete(id);
  }

  private async withOfferCounts(
    targets: ScrapeTarget[],
    userId: string,
  ): Promise<ScrapeTargetWithCount[]> {
    if (targets.length === 0) {
      return [];
    }
    const ids = targets.map((t) => t.id);

    const counts = await this.offers
      .createQueryBuilder('o')
      .select('o.scrapeTargetId', 'targetId')
      .addSelect('COUNT(*)', 'count')
      .where('o.scrapeTargetId IN (:...ids)', { ids })
      .andWhere('o.deletedAt IS NULL')
      .groupBy('o.scrapeTargetId')
      .getRawMany<{ targetId: string; count: string }>();

    // Pending = no action taken: not dismissed and not added to recruitment by
    // the requesting user.
    const pending = await this.offers
      .createQueryBuilder('o')
      .select('o.scrapeTargetId', 'targetId')
      .addSelect('COUNT(*)', 'count')
      .where('o.scrapeTargetId IN (:...ids)', { ids })
      .andWhere('o.deletedAt IS NULL')
      .andWhere('o.dismissed = false')
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM "recruitments" r WHERE r."jobOfferId" = o.id AND r."userId" = :userId)',
        { userId },
      )
      .groupBy('o.scrapeTargetId')
      .getRawMany<{ targetId: string; count: string }>();

    const countByTarget = new Map(counts.map((c) => [c.targetId, Number(c.count)]));
    const pendingByTarget = new Map(pending.map((c) => [c.targetId, Number(c.count)]));

    return targets.map((target) => ({
      ...target,
      offerCount: countByTarget.get(target.id) ?? 0,
      pendingCount: pendingByTarget.get(target.id) ?? 0,
    }));
  }
}
