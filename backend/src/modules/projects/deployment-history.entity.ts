import { DeploymentStatus } from '@evpanel/shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('deployment_history')
export class DeploymentHistory extends BaseEntity {
  @Index()
  @Column('uuid')
  projectId!: string;

  @Column({ type: 'varchar', nullable: true })
  version!: string | null;

  @Column({ type: 'varchar', nullable: true })
  commitSha!: string | null;

  @Column({ type: 'enum', enum: DeploymentStatus, default: DeploymentStatus.SUCCESS })
  status!: DeploymentStatus;

  @Column({ type: 'timestamptz' })
  deployedAt!: Date;
}
