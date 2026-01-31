import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { WaitlistRepository } from './waitlist.repository';
import type { WaitlistEntryDto, WaitlistRequestedType, WaitlistStatus } from './dto/waitlist.dto';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class WaitlistReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly waitlistRepository: WaitlistRepository
  ) {}

  async list(status?: WaitlistStatus): Promise<WaitlistEntryDto[]> {
    const rows = await this.waitlistRepository.list(this.databaseService.client, status);
    return rows.map((row) => this.toDto(row));
  }

  async findById(id: string) {
    return this.waitlistRepository.findById(this.databaseService.client, id);
  }

  private toDto(row: Selectable<Database['waitlist_entries']>): WaitlistEntryDto {
    return {
      id: row.id,
      customerId: row.customer_id,
      requestedType: row.requested_type as WaitlistRequestedType,
      status: row.status as WaitlistStatus,
      notes: row.notes ?? null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
