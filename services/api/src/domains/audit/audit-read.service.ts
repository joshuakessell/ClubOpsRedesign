import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { throwValidation } from '../../platform/http/errors';
import { AuditReadRepository } from './audit-read.repository';
import type { AuditLogDto } from './dto/audit-log.dto';

export type AuditReadQueryInput = {
  limit?: string;
  cursor?: string;
  entityType?: string;
  entityId?: string;
  actorStaffId?: string;
  action?: string;
  since?: string;
};

@Injectable()
export class AuditReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditReadRepository: AuditReadRepository
  ) {}

  async listAudit(query: AuditReadQueryInput): Promise<{ items: AuditLogDto[]; nextCursor: string | null }> {
    const limit = this.parseLimit(query.limit);
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const since = query.since ? this.parseSince(query.since) : undefined;

    const rows = await this.auditReadRepository.list(this.databaseService.client, {
      limit: limit + 1,
      cursor,
      entityType: query.entityType,
      entityId: query.entityId,
      actorStaffId: query.actorStaffId,
      action: query.action,
      since,
    });

    const hasNext = rows.length > limit;
    const items = rows.slice(0, limit).map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actorStaffId: row.actor_staff_id ?? null,
      actorDeviceId: row.actor_device_id ?? null,
      metadata: row.metadata ?? {},
      createdAt: row.created_at.toISOString(),
    }));

    const nextCursor = hasNext ? this.encodeCursor(items[items.length - 1]) : null;

    return { items, nextCursor };
  }

  private parseLimit(raw?: string): number {
    if (!raw) return 50;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throwValidation('limit must be a positive number');
    }
    return Math.min(parsed, 200);
  }

  private parseSince(raw: string): Date {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throwValidation('since must be a valid ISO timestamp');
    }
    return date;
  }

  private decodeCursor(cursor: string): { createdAt: Date; id: string } {
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf8');
      const data = JSON.parse(json) as { createdAt: string; id: string };
      if (!data?.createdAt || !data?.id) {
        throw new Error('Invalid cursor shape');
      }
      const createdAt = new Date(data.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor timestamp');
      }
      return { createdAt, id: data.id };
    } catch {
      throwValidation('cursor must be a valid base64 JSON payload');
    }
  }

  private encodeCursor(item: AuditLogDto): string {
    const payload = JSON.stringify({ createdAt: item.createdAt, id: item.id });
    return Buffer.from(payload, 'utf8').toString('base64');
  }
}
