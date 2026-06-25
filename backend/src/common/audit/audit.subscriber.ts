import { AuditAction } from '../../shared';
import {
  DataSource,
  EntityManager,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';

import { AuditLog } from './audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  private isAuditable(metadataName: string): boolean {
    return metadataName !== AuditLog.name;
  }

  async afterInsert(event: InsertEvent<unknown>): Promise<void> {
    if (!this.isAuditable(event.metadata.name)) {
      return;
    }
    await this.write(event, AuditAction.CREATE, event.entity);
  }

  async afterUpdate(event: UpdateEvent<unknown>): Promise<void> {
    if (!this.isAuditable(event.metadata.name)) {
      return;
    }
    await this.write(event, AuditAction.UPDATE, event.entity);
  }

  async afterRemove(event: RemoveEvent<unknown>): Promise<void> {
    if (!this.isAuditable(event.metadata.name)) {
      return;
    }
    await this.write(event, AuditAction.DELETE, event.databaseEntity);
  }

  private async write(
    event: { manager: EntityManager },
    action: AuditAction,
    entity: unknown,
  ): Promise<void> {
    if (!entity) {
      return;
    }
    const record = entity as { id?: string; constructor: { name: string } };

    const log = new AuditLog();
    log.entity = record.constructor?.name ?? 'unknown';
    log.entityId = record.id ?? null;
    log.action = action;
    log.userId = null; // wire request-scoped user via CLS/AsyncLocalStorage later
    // Serialize to a plain JSON object (strips functions/cycles) for the jsonb column.
    log.diff = JSON.parse(JSON.stringify(entity)) as Record<string, unknown>;

    await event.manager.getRepository(AuditLog).save(log);
  }
}
