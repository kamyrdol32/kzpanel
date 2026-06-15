import { JobLevel, JobSource, Language, RemoteType } from '@evpanel/shared';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Maps to the same `job_offers` table owned by the backend. Declared locally so
 * the scraper stays a self-contained deployable. Schema ownership/migrations
 * remain with the backend.
 */
@Entity('job_offers')
@Index(['source', 'sourceUrl'], { unique: true })
export class JobOffer {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() title!: string;
  @Column() company!: string;
  @Column({ type: 'int', nullable: true }) salaryMin!: number | null;
  @Column({ type: 'int', nullable: true }) salaryMax!: number | null;
  @Column({ type: 'varchar', nullable: true }) currency!: string | null;
  @Column({ type: 'varchar', nullable: true }) location!: string | null;

  @Column({ type: 'enum', enum: RemoteType, default: RemoteType.REMOTE }) remoteType!: RemoteType;
  @Column({ type: 'enum', enum: JobLevel, default: JobLevel.MID }) level!: JobLevel;
  @Column({ type: 'enum', enum: Language, default: Language.PL }) language!: Language;
  @Column({ type: 'enum', enum: JobSource }) source!: JobSource;
  @Column() sourceUrl!: string;

  @Column({ type: 'timestamptz', nullable: true }) publishedDate!: Date | null;
  @Column({ type: 'text', nullable: true }) description!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" }) responsibilities!: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) requirements!: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) mustHave!: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) niceToHave!: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) benefits!: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) techStack!: string[];

  @Index()
  @Column({ type: 'uuid', nullable: true }) scrapeTargetId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}
