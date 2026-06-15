import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { Project } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  findAll(): Promise<Project[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  create(dto: CreateProjectDto): Promise<Project> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id); // soft delete (deletedAt)
  }

  /** Used by the health poller — projects exposing a health endpoint. */
  findWithHealthEndpoint(): Promise<Project[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.healthEndpoint IS NOT NULL')
      .getMany();
  }
}
