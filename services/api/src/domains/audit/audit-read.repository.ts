import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

export type AuditReadQuery = {
  limit: number;
  cursor?: { createdAt: Date; id: string };
  entityType?: string;
  entityId?: string;
  actorStaffId?: string;
  action?: string;
  since?: Date;
};

@Injectable()
export class AuditReadRepository {
  async list(db: Kysely<Database>, query: AuditReadQuery) {
    let builder = db
      .selectFrom('audit_log')
      .selectAll()
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc');

    if (query.entityType) {
      builder = builder.where('entity_type', '=', query.entityType);
    }
    if (query.entityId) {
      builder = builder.where('entity_id', '=', query.entityId);
    }
    if (query.actorStaffId) {
      builder = builder.where('actor_staff_id', '=', query.actorStaffId);
    }
    if (query.action) {
      builder = builder.where('action', '=', query.action);
    }
    if (query.since) {
      builder = builder.where('created_at', '>=', query.since);
    }
    if (query.cursor) {
      builder = builder.where((eb) =>
        eb.or([
          eb('created_at', '<', query.cursor!.createdAt),
          eb.and([
            eb('created_at', '=', query.cursor!.createdAt),
            eb('id', '<', query.cursor!.id),
          ]),
        ])
      );
    }

    return builder.limit(query.limit).execute();
  }
}
