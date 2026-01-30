import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import type { AuditEntryDto } from './dto/audit-entry.dto';

@Injectable()
export class AuditRepository {
  async write(db: Kysely<Database>, _entry: AuditEntryDto) {
    return db
      .insertInto('audit_log')
      .values({
        actor_staff_id: _entry.actorStaffId ?? null,
        actor_device_id: _entry.actorDeviceId ?? null,
        action: _entry.action,
        entity_type: _entry.entityType,
        entity_id: _entry.entityId,
        metadata: _entry.metadata ?? {},
        created_at: new Date(),
      })
      .execute();
  }
}
