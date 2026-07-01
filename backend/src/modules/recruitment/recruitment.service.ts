import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { JwtPayload, Role } from '../../shared';
import { JobOffer } from '../jobs/job-offer.entity';

import { CreateRecruitmentDto, UpdateRecruitmentDto } from './dto/recruitment.dto';
import { Recruitment } from './recruitment.entity';

export type RecruitmentWithOffer = Recruitment & { jobOffer: JobOffer | null };

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectRepository(Recruitment)
    private readonly repo: Repository<Recruitment>,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
  ) {}

  async findAll(user: JwtPayload): Promise<RecruitmentWithOffer[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .orderBy('r.appliedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('r.createdAt', 'DESC')
      .where('r.deletedAt IS NULL');

    if (user.role !== Role.ADMIN) {
      qb.andWhere('r.userId = :userId', { userId: user.sub });
    }

    return this.withJobOffers(await qb.getMany());
  }

  async findOne(id: string, user: JwtPayload): Promise<RecruitmentWithOffer> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Recruitment not found');
    }

    if (user.role !== Role.ADMIN && found.userId !== user.sub) {
      throw new ForbiddenException('Not your recruitment entry');
    }

    const [withOffer] = await this.withJobOffers([found]);
    return withOffer;
  }

  async create(dto: CreateRecruitmentDto, user: JwtPayload): Promise<RecruitmentWithOffer> {
    const saved = await this.repo.save(
      this.repo.create({
        ...dto,
        userId: user.sub,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : null,
      }),
    );
    const [withOffer] = await this.withJobOffers([saved]);
    return withOffer;
  }

  async update(id: string, dto: UpdateRecruitmentDto, user: JwtPayload): Promise<RecruitmentWithOffer> {
    await this.findOne(id, user);
    await this.repo.update(id, {
      ...dto,
      appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
    });
    return this.findOne(id, user);
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    await this.findOne(id, user);
    await this.repo.softDelete(id);
  }

  /** Attaches the full scraped offer (description, requirements, links, …) each entry was created from, if any. */
  private async withJobOffers(rows: Recruitment[]): Promise<RecruitmentWithOffer[]> {
    const ids = [...new Set(rows.map((r) => r.jobOfferId).filter((id): id is string => !!id))];
    if (ids.length === 0) {
      return rows.map((r) => ({ ...r, jobOffer: null }));
    }

    const offers = await this.offers.find({ where: { id: In(ids) } });
    const offerById = new Map(offers.map((o) => [o.id, o]));

    return rows.map((r) => ({
      ...r,
      jobOffer: r.jobOfferId ? (offerById.get(r.jobOfferId) ?? null) : null,
    }));
  }
}
