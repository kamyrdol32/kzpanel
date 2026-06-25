import { JobSource, RemoteType } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('scrape_targets')
@Index(['userId', 'source', 'query', 'location'], { unique: true })
export class ScrapeTarget extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ type: 'enum', enum: JobSource })
  source!: JobSource;

  @Column()
  query!: string;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({ type: 'enum', enum: RemoteType, nullable: true })
  remoteType!: RemoteType | null;

  @Column({ default: false })
  includeAllRemote!: boolean;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt!: Date | null;
}
