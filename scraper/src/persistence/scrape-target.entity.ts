import { JobSource, RemoteType } from '@evpanel/shared';
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
 * Maps the `scrape_targets` table owned by the backend. The scraper reads these
 * to know what to search for. Schema ownership/migrations stay with the backend.
 */
@Entity('scrape_targets')
export class ScrapeTarget {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'enum', enum: JobSource })
  source!: JobSource;

  @Column() query!: string;
  @Column({ type: 'varchar', nullable: true }) location!: string | null;
  @Column({ type: 'enum', enum: RemoteType, nullable: true }) remoteType!: RemoteType | null;
  @Column({ default: true }) enabled!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) lastRunAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}
