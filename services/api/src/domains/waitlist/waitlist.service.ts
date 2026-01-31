import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { CustomersReadService } from '../customers/customers.read.service';
import { WaitlistRepository } from './waitlist.repository';
import type { CreateWaitlistEntryRequestDto } from './dto/waitlist-requests.dto';
import type { WaitlistEntryDto, WaitlistRequestedType } from './dto/waitlist.dto';
import { throwNotFound, throwValidation } from '../../platform/http/errors';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

const REQUEST_TYPES: WaitlistRequestedType[] = ['room', 'locker', 'any'];

@Injectable()
export class WaitlistService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly waitlistRepository: WaitlistRepository,
    private readonly customersReadService: CustomersReadService,
    private readonly auditService: AuditService
  ) {}

  async create(
    request: CreateWaitlistEntryRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<WaitlistEntryDto> {
    if (!request.customerId) {
      throwValidation('customerId is required');
    }
    if (!request.requestedType || !REQUEST_TYPES.includes(request.requestedType)) {
      throwValidation('requestedType must be room, locker, or any');
    }

    const customer = await this.customersReadService.findById(request.customerId);
    if (!customer) {
      throwNotFound('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const created = await this.databaseService.transaction(async (trx) => {
      const row = await this.waitlistRepository.create(trx, {
        customer_id: request.customerId,
        requested_type: request.requestedType,
        status: 'OPEN',
        notes: request.notes ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await this.auditService.write(
        {
          action: 'WAITLIST_CREATED',
          entityType: 'waitlist_entry',
          entityId: row.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            requestedType: row.requested_type,
          },
        },
        trx
      );

      return row;
    });

    return this.toDto(created);
  }

  async cancel(
    entryId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<WaitlistEntryDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const existing = await this.waitlistRepository.findById(trx, entryId);
      if (!existing) {
        throwNotFound('Waitlist entry not found', 'WAITLIST_NOT_FOUND');
      }
      const row = await this.waitlistRepository.update(trx, entryId, {
        status: 'CANCELLED',
        updated_at: new Date(),
      });
      if (!row) {
        throwNotFound('Waitlist entry not found', 'WAITLIST_NOT_FOUND');
      }

      await this.auditService.write(
        {
          action: 'WAITLIST_CANCELLED',
          entityType: 'waitlist_entry',
          entityId: row.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            previousStatus: existing.status,
          },
        },
        trx
      );

      return row;
    });

    return this.toDto(updated);
  }

  private toDto(row: Selectable<Database['waitlist_entries']>): WaitlistEntryDto {
    return {
      id: row.id,
      customerId: row.customer_id,
      requestedType: row.requested_type as WaitlistRequestedType,
      status: row.status as any,
      notes: row.notes ?? null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
