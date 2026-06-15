import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Time-series sample for a monitored service (no soft-delete — append only). */
@Entity('metric_samples')
@Index(['serviceId', 'sampledAt'])
export class MetricSample {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  serviceId!: string;

  @Column({ type: 'float', nullable: true })
  cpu!: number | null;

  @Column({ type: 'float', nullable: true })
  ram!: number | null;

  @Column({ type: 'float', nullable: true })
  disk!: number | null;

  @Column({ type: 'int', nullable: true })
  responseTime!: number | null;

  @Index()
  @Column({ type: 'timestamptz' })
  sampledAt!: Date;
}
