import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditRepository } from './audit.repository';
import type { AuditEntryDto } from './dto/audit-entry.dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditRepository: AuditRepository
  ) {}

  async write(entry: AuditEntryDto): Promise<void> {
    const db = this.databaseService.client;
    await this.auditRepository.write(db, entry);
  }
}
