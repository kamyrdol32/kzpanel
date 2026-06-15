import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base for every persisted entity.
 * Provides UUID id + audit timestamps + soft-delete column (deletedAt).
 * TypeORM honours `deletedAt` automatically when using `softRemove`/`softDelete`.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
