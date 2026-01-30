import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditRepository } from './audit.repository';
import type { AuditEntryDto } from './dto/audit-entry.dto';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class AuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditRepository: AuditRepository
  ) {}

  async write(entry: AuditEntryDto, dbOverride?: Kysely<Database>): Promise<void> {
    const db = dbOverride ?? this.databaseService.client;
    await this.auditRepository.write(db, entry);
  }
}
