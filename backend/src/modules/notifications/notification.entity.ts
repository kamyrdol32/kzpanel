import { NotificationType } from '@evpanel/shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Index()
  @Column('uuid')
  userId!: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;
}
