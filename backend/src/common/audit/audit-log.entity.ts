import { AuditAction } from '@evpanel/shared';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Append-only audit trail of entity mutations. */
@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  entity!: string;

  @Column('uuid', { nullable: true })
  entityId!: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Index()
  @Column('uuid', { nullable: true })
  userId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  diff!: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
