import { ServiceStatus } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('services')
export class MonitoredService extends BaseEntity {
  @Index()
  @Column()
  name!: string;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.UNKNOWN })
  status!: ServiceStatus;

  @Column({ type: 'float', default: 0 })
  uptime!: number;

  @Column({ type: 'int', nullable: true })
  responseTime!: number | null;

  @Column({ type: 'float', nullable: true })
  cpu!: number | null;

  @Column({ type: 'float', nullable: true })
  ram!: number | null;

  @Column({ type: 'float', nullable: true })
  disk!: number | null;

  @Column({ type: 'varchar', nullable: true })
  target!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastChecked!: Date | null;
}
