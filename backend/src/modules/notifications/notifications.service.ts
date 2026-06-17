import { NotificationType } from '../../shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, readAt: IsNull() } });
  }

  create(userId: string, title: string, type = NotificationType.INFO, body?: string) {
    return this.repo.save(this.repo.create({ userId, title, type, body: body ?? null }));
  }

  async markRead(id: string): Promise<void> {
    await this.repo.update(id, { readAt: new Date() });
  }
}
