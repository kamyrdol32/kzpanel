import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtPayload, Role } from '../../shared';
import { CreateRecruitmentDto, UpdateRecruitmentDto } from './dto/recruitment.dto';
import { Recruitment } from './recruitment.entity';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectRepository(Recruitment)
    private readonly repo: Repository<Recruitment>,
  ) {}

  findAll(user: JwtPayload): Promise<Recruitment[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .orderBy('r.appliedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('r.createdAt', 'DESC')
      .where('r.deletedAt IS NULL');

    if (user.role !== Role.ADMIN) {
      qb.andWhere('r.userId = :userId', { userId: user.sub });
    }

    return qb.getMany();
  }

  async findOne(id: string, user: JwtPayload): Promise<Recruitment> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Recruitment not found');
    }

    if (user.role !== Role.ADMIN && found.userId !== user.sub) {
      throw new ForbiddenException('Not your recruitment entry');
    }

    return found;
  }

  create(dto: CreateRecruitmentDto, user: JwtPayload): Promise<Recruitment> {
    return this.repo.save(
      this.repo.create({
        ...dto,
        userId: user.sub,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : null,
      }),
    );
  }

  async update(id: string, dto: UpdateRecruitmentDto, user: JwtPayload): Promise<Recruitment> {
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
}
