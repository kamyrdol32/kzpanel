import { Permission, Role } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'citext' })
  username!: string;

  @Index({ unique: true })
  @Column({ type: 'citext', nullable: true })
  email!: string | null;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ type: 'simple-array', default: '' })
  permissions!: Permission[];

  @Column({ default: false })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  activationToken!: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  resetToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetTokenExpiresAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}
