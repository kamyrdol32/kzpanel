import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRecruitmentDto, UpdateRecruitmentDto } from './dto/recruitment.dto';
import { Recruitment } from './recruitment.entity';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectRepository(Recruitment)
    private readonly repo: Repository<Recruitment>,
  ) {}

  findAll(): Promise<Recruitment[]> {
    return this.repo.find({ order: { appliedAt: 'DESC', createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Recruitment> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Recruitment not found');
    return found;
  }

  create(dto: CreateRecruitmentDto): Promise<Recruitment> {
    return this.repo.save(
      this.repo.create({ ...dto, appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : null }),
    );
  }

  async update(id: string, dto: UpdateRecruitmentDto): Promise<Recruitment> {
    await this.findOne(id);
    await this.repo.update(id, {
      ...dto,
      appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
