import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

/** Persisted (hashed) refresh tokens to support rotation + revocation. */
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Index()
  @Column('uuid')
  userId!: string;

  @Column()
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
