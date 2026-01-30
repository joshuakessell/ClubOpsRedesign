import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import type { AuditEntryDto } from './dto/audit-entry.dto';

@Injectable()
export class AuditRepository {
  async write(db: Kysely<Database>, _entry: AuditEntryDto) {
    void db;
    throw new Error('Not implemented');
  }
}
