import { ProjectStatus } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @Index()
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  githubUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  liveUrl!: string | null;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status!: ProjectStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  technologies!: string[];

  @Column({ type: 'varchar', nullable: true })
  healthEndpoint!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastDeployAt!: Date | null;
}
