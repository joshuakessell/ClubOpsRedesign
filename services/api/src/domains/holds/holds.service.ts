import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { InventoryService } from '../inventory/inventory.service';
import { VisitsReadService } from '../visits/visits.read.service';
import { WaitlistReadService } from '../waitlist/waitlist.read.service';
import { HoldsRepository } from './holds.repository';
import type { CreateHoldRequestDto } from './dto/hold-requests.dto';
import type { HoldDto } from './dto/hold.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class HoldsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly holdsRepository: HoldsRepository,
    private readonly inventoryService: InventoryService,
    private readonly assignmentsService: AssignmentsService,
    private readonly visitsReadService: VisitsReadService,
    private readonly waitlistReadService: WaitlistReadService,
    private readonly auditService: AuditService
  ) {}

  async create(
    request: CreateHoldRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<HoldDto> {
    return this.databaseService.transaction(async (trx) => {
      const created = await this.createInTransaction(trx, request, actor);
      return this.toDto(created);
    });
  }

  async createInTransaction(
    trx: DatabaseService['client'],
    request: CreateHoldRequestDto,
    actor: { staffId: string; deviceId: string }
  ) {
    if (!request.inventoryItemId) {
      throwValidation('inventoryItemId is required');
    }
    if (!request.expiresAt) {
      throwValidation('expiresAt is required');
    }
    const expiresAt = new Date(request.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throwValidation('expiresAt must be a valid ISO timestamp');
    }
    if (expiresAt.getTime() <= Date.now()) {
      throwValidation('expiresAt must be in the future');
    }

    const hasVisitId = Boolean(request.visitId);
    const hasWaitlistId = Boolean(request.waitlistEntryId);
    if (hasVisitId === hasWaitlistId) {
      throwValidation('exactly one of visitId or waitlistEntryId is required');
    }

    if (request.visitId) {
      const visit = await this.visitsReadService.findById(request.visitId, trx);
      if (!visit) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }
      if (visit.status !== 'ACTIVE') {
        throwConflict('Visit is not active', 'HOLD_CONFLICT');
      }
    }

    if (request.waitlistEntryId) {
      const entry = await this.waitlistReadService.findById(request.waitlistEntryId, trx);
      if (!entry) {
        throwNotFound('Waitlist entry not found', 'WAITLIST_NOT_FOUND');
      }
      if (entry.status !== 'OPEN') {
        throwConflict('Waitlist entry is not open', 'HOLD_CONFLICT');
      }
    }

    try {
      const item = await this.inventoryService.findByIdForUpdate(trx, request.inventoryItemId);
      if (!item) {
        throwNotFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
      }
      if (item.status !== 'AVAILABLE') {
        throwConflict('Inventory item is not available', 'HOLD_CONFLICT');
      }
      const activeAssignment = await this.assignmentsService.findActiveByInventoryItem(
        trx,
        request.inventoryItemId
      );
      if (activeAssignment) {
        throwConflict('Inventory item is already assigned', 'HOLD_CONFLICT');
      }
      let activeHold = await this.holdsRepository.findActiveByInventoryItem(trx, request.inventoryItemId);
      if (activeHold && activeHold.expires_at <= new Date()) {
        await this.holdsRepository.update(trx, activeHold.id, { status: 'EXPIRED' });
        activeHold = undefined;
      }
      if (activeHold) {
        throwConflict('Inventory item already has an active hold', 'HOLD_CONFLICT');
      }

      const hold = await this.holdsRepository.create(trx, {
        inventory_item_id: request.inventoryItemId,
        visit_id: request.visitId ?? null,
        waitlist_entry_id: request.waitlistEntryId ?? null,
        status: 'ACTIVE',
        expires_at: expiresAt,
        created_at: new Date(),
      });

      await this.auditService.write(
        {
          action: 'HOLD_CREATED',
          entityType: 'inventory_hold',
          entityId: hold.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            inventoryItemId: hold.inventory_item_id,
            visitId: hold.visit_id,
            waitlistEntryId: hold.waitlist_entry_id,
          },
        },
        trx
      );

      return hold;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throwConflict('Inventory item already has an active hold', 'HOLD_CONFLICT');
      }
      throw error;
    }
  }

  async releaseActiveHoldForInventoryItem(
    trx: DatabaseService['client'],
    inventoryItemId: string,
    actor: { staffId: string; deviceId: string }
  ) {
    const existing = await this.holdsRepository.findActiveByInventoryItemForUpdate(trx, inventoryItemId);
    if (!existing) {
      return null;
    }

    const hold = await this.holdsRepository.update(trx, existing.id, {
      status: 'RELEASED',
    });

    if (!hold) {
      return null;
    }

    await this.auditService.write(
      {
        action: 'HOLD_RELEASED',
        entityType: 'inventory_hold',
        entityId: hold.id,
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        metadata: {
          previousStatus: existing.status,
          source: 'UPGRADE_ACCEPT',
        },
      },
      trx
    );

    return hold;
  }

  async release(
    holdId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<HoldDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const existing = await this.holdsRepository.findById(trx, holdId);
      if (!existing) {
        throwNotFound('Hold not found', 'HOLD_NOT_FOUND');
      }
      if (existing.status === 'EXPIRED') {
        throwConflict('Hold expired', 'HOLD_EXPIRED');
      }
      if (existing.status === 'RELEASED') {
        return existing;
      }

      const hold = await this.holdsRepository.update(trx, holdId, {
        status: 'RELEASED',
      });

      if (!hold) {
        throwNotFound('Hold not found', 'HOLD_NOT_FOUND');
      }

      await this.auditService.write(
        {
          action: 'HOLD_RELEASED',
          entityType: 'inventory_hold',
          entityId: hold.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            previousStatus: existing.status,
          },
        },
        trx
      );

      return hold;
    });

    return this.toDto(updated);
  }

  private toDto(row: Selectable<Database['inventory_holds']>): HoldDto {
    return {
      id: row.id,
      inventoryItemId: row.inventory_item_id,
      visitId: row.visit_id ?? null,
      waitlistEntryId: row.waitlist_entry_id ?? null,
      status: row.status as any,
      expiresAt: row.expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
    };
  }
}
