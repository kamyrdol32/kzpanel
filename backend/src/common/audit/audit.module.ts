import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLog } from './audit-log.entity';
import { AuditSubscriber } from './audit.subscriber';

/** Registers the global audit subscriber + audit_log repository. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditSubscriber],
  exports: [TypeOrmModule],
})
export class AuditModule {}
