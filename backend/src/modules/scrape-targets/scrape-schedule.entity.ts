import { RecurrenceType } from '../../shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity('scrape_schedules')
export class ScrapeSchedule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  public scrapeTargetId!: string;

  @Column({ type: 'enum', enum: RecurrenceType })
  public recurrenceType!: RecurrenceType;

  @Column({ type: 'varchar', length: 5 })
  public time!: string;

  @Column({ type: 'int', array: true, nullable: true })
  public daysOfWeek!: number[] | null;

  @Column({ type: 'smallint', nullable: true })
  public dayOfMonth!: number | null;

  @Column({ default: true })
  public enabled!: boolean;
}
