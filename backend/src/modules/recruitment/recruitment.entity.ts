import { JobLevel, RecruitmentStatus, RemoteType } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('recruitments')
export class Recruitment extends BaseEntity {
  @Column()
  company!: string;

  @Column()
  position!: string;

  @Column({ type: 'enum', enum: JobLevel, default: JobLevel.MID })
  level!: JobLevel;

  @Column({ type: 'enum', enum: RemoteType, default: RemoteType.REMOTE })
  workMode!: RemoteType;

  @Column({ type: 'int', nullable: true })
  salaryMin!: number | null;

  @Column({ type: 'int', nullable: true })
  salaryMax!: number | null;

  @Column({ type: 'varchar', nullable: true })
  currency!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  appliedAt!: Date | null;

  @Index()
  @Column({ type: 'enum', enum: RecruitmentStatus, default: RecruitmentStatus.NEW })
  status!: RecruitmentStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  jobOfferId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
