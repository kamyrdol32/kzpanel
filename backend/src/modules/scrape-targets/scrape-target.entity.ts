import { JobSource, RemoteType } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

/** Configured scraping target managed from the panel. */
@Entity('scrape_targets')
@Index(['source', 'query', 'location'], { unique: true })
export class ScrapeTarget extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: JobSource })
  source!: JobSource;

  @Column()
  query!: string;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({ type: 'enum', enum: RemoteType, nullable: true })
  remoteType!: RemoteType | null;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt!: Date | null;
}
