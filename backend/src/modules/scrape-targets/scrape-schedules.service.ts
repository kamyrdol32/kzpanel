import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { RecurrenceType } from '../../shared';

import { CreateScrapeScheduleDto, UpdateScrapeScheduleDto } from './dto/scrape-schedule.dto';
import { ScrapeSchedule } from './scrape-schedule.entity';

@Injectable()
export class ScrapeSchedulesService {
  public constructor(
    @InjectRepository(ScrapeSchedule)
    private readonly repo: Repository<ScrapeSchedule>,
  ) {}

  public findAllForTarget(scrapeTargetId: string): Promise<ScrapeSchedule[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.scrapeTargetId = :scrapeTargetId', { scrapeTargetId })
      .orderBy('s.time', 'ASC')
      .getMany();
  }

  public create(scrapeTargetId: string, dto: CreateScrapeScheduleDto): Promise<ScrapeSchedule> {
    this.validateRecurrenceFields(dto);
    return this.repo.save(
      this.repo.create({
        scrapeTargetId,
        recurrenceType: dto.recurrenceType,
        time: dto.time,
        daysOfWeek: dto.daysOfWeek ?? null,
        dayOfMonth: dto.dayOfMonth ?? null,
        enabled: dto.enabled ?? true,
      }),
    );
  }

  public async update(
    id: string,
    scrapeTargetId: string,
    dto: UpdateScrapeScheduleDto,
  ): Promise<ScrapeSchedule> {
    const schedule = await this.findOneForTarget(id, scrapeTargetId);
    this.validateRecurrenceFields({ ...schedule, ...dto });
    await this.repo.update(id, dto);
    return this.findOneForTarget(id, scrapeTargetId);
  }

  public async remove(id: string, scrapeTargetId: string): Promise<void> {
    await this.findOneForTarget(id, scrapeTargetId);
    await this.repo.delete(id);
  }

  public findDueSchedules(weekday: number, dayOfMonth: number, hhmm: string): Promise<ScrapeSchedule[]> {
    return this.repo
      .createQueryBuilder('schedule')
      .innerJoin('scrape_targets', 'target', 'target.id = schedule.scrapeTargetId')
      .where('schedule.enabled = true')
      .andWhere('target.enabled = true')
      .andWhere('target.deletedAt IS NULL')
      .andWhere('schedule.time = :hhmm', { hhmm })
      .andWhere(
        new Brackets((qb) => {
          qb.where('schedule.recurrenceType = :daily', { daily: RecurrenceType.DAILY })
            .orWhere('schedule.recurrenceType = :weekly AND :weekday = ANY(schedule.daysOfWeek)', {
              weekly: RecurrenceType.WEEKLY,
              weekday,
            })
            .orWhere('schedule.recurrenceType = :monthly AND schedule.dayOfMonth = :dayOfMonth', {
              monthly: RecurrenceType.MONTHLY,
              dayOfMonth,
            });
        }),
      )
      .getMany();
  }

  private async findOneForTarget(id: string, scrapeTargetId: string): Promise<ScrapeSchedule> {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule || schedule.scrapeTargetId !== scrapeTargetId) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }

  private validateRecurrenceFields(fields: {
    recurrenceType: RecurrenceType;
    daysOfWeek?: number[] | null;
    dayOfMonth?: number | null;
  }): void {
    if (fields.recurrenceType === RecurrenceType.WEEKLY && !fields.daysOfWeek?.length) {
      throw new BadRequestException('Weekly schedule requires at least one day of week');
    }
    if (fields.recurrenceType === RecurrenceType.MONTHLY && !fields.dayOfMonth) {
      throw new BadRequestException('Monthly schedule requires a day of month');
    }
  }
}
