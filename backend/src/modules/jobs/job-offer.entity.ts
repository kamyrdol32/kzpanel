import { JobLevel, JobSource, Language, RemoteType } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('job_offers')
@Index(['source', 'sourceUrl'], { unique: true })
export class JobOffer extends BaseEntity {
  @Index()
  @Column()
  title!: string;

  @Column()
  company!: string;

  @Column({ type: 'int', nullable: true })
  salaryMin!: number | null;

  @Column({ type: 'int', nullable: true })
  salaryMax!: number | null;

  @Column({ type: 'varchar', nullable: true })
  currency!: string | null;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({ type: 'enum', enum: RemoteType, default: RemoteType.REMOTE })
  remoteType!: RemoteType;

  @Column({ type: 'enum', enum: JobLevel, default: JobLevel.MID })
  level!: JobLevel;

  @Column({ type: 'enum', enum: Language, default: Language.PL })
  language!: Language;

  @Index()
  @Column({ type: 'enum', enum: JobSource })
  source!: JobSource;

  @Column()
  sourceUrl!: string;

  @Column({ type: 'timestamptz', nullable: true })
  publishedDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  responsibilities!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  requirements!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  mustHave!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  niceToHave!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  benefits!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  techStack!: string[];

  /** Scrape target this offer originated from; used to cascade-delete on target removal. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  scrapeTargetId!: string | null;

  /** Reviewed and marked as not interesting — greyed out on the list. */
  @Index()
  @Column({ type: 'boolean', default: false })
  dismissed!: boolean;
}
