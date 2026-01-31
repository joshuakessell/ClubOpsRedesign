import { Injectable } from '@nestjs/common';
import type { Kysely, Selectable, Updateable } from 'kysely';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { InventoryRepository } from './inventory.repository';
import type { CreateInventoryItemRequestDto, UpdateInventoryStatusRequestDto } from './dto/inventory-requests.dto';
import type { InventoryItemDto, InventoryItemType, InventoryStatus } from './dto/inventory.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import type { Database } from '../../platform/database/database.types';

const INVENTORY_TYPES: InventoryItemType[] = ['room', 'locker'];
const INVENTORY_STATUSES: InventoryStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'DIRTY',
  'CLEANING',
  'OUT_OF_SERVICE',
];

const STAFF_ALLOWED_TRANSITIONS: Record<InventoryStatus, InventoryStatus[]> = {
  AVAILABLE: ['DIRTY', 'OUT_OF_SERVICE'],
  OCCUPIED: ['DIRTY', 'OUT_OF_SERVICE'],
  DIRTY: ['CLEANING', 'OUT_OF_SERVICE'],
  CLEANING: ['AVAILABLE', 'OUT_OF_SERVICE'],
  OUT_OF_SERVICE: ['AVAILABLE'],
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly auditService: AuditService
  ) {}

  async createItem(request: CreateInventoryItemRequestDto, actorStaffId: string | null): Promise<InventoryItemDto> {
    if (!request.name || !request.type) {
      throwValidation('type and name are required');
    }
    if (!INVENTORY_TYPES.includes(request.type)) {
      throwValidation('type must be room or locker');
    }
    const status = request.status ?? 'AVAILABLE';
    if (!INVENTORY_STATUSES.includes(status)) {
      throwValidation('status is invalid');
    }
    if (status === 'OUT_OF_SERVICE' && !request.notes) {
      throwValidation('note is required when status is OUT_OF_SERVICE');
    }

    const now = new Date();
    const created = await this.databaseService.transaction(async (trx) => {
      const item = await this.inventoryRepository.create(trx, {
        type: request.type,
        name: request.name,
        status,
        notes: request.notes ?? null,
        created_at: now,
        updated_at: now,
      });

      await this.auditService.write(
        {
          action: 'INVENTORY_ITEM_CREATED',
          entityType: 'inventory_item',
          entityId: item.id,
          actorStaffId,
          metadata: {
            type: item.type,
            name: item.name,
            status: item.status,
          },
        },
        trx
      );

      return item;
    });

    return this.toDto(created);
  }

  async updateStatus(
    itemId: string,
    request: UpdateInventoryStatusRequestDto,
    actor: { staffId: string; deviceId: string; role: 'staff' | 'admin' }
  ): Promise<InventoryItemDto> {
    const toStatus = request.toStatus;
    if (!INVENTORY_STATUSES.includes(toStatus)) {
      throwValidation('toStatus is invalid');
    }

    const { updated } = await this.databaseService.transaction((trx) =>
      this.transitionStatus(trx, itemId, toStatus, {
        note: request.note,
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        allowAny: actor.role === 'admin',
        source: 'MANUAL',
      })
    );

    return this.toDto(updated);
  }

  async transitionStatus(
    db: Kysely<Database>,
    itemId: string,
    toStatus: InventoryStatus,
    options: {
      note?: string | null;
      actorStaffId?: string | null;
      actorDeviceId?: string | null;
      allowAny?: boolean;
      source?: string;
    }
  ): Promise<{ updated: Selectable<Database['inventory_items']>; fromStatus: InventoryStatus }> {
    const current = await this.inventoryRepository.findByIdForUpdate(db, itemId);
    if (!current) {
      throwNotFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
    }

    if (current.status === toStatus) {
      throwConflict('Inventory item already has that status', 'INVALID_STATUS_TRANSITION');
    }

    if (toStatus === 'OUT_OF_SERVICE' && !options.note) {
      throwValidation('note is required when setting OUT_OF_SERVICE');
    }

    if (!options.allowAny) {
      const allowed = STAFF_ALLOWED_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(toStatus)) {
        throwConflict('Invalid inventory status transition', 'INVALID_STATUS_TRANSITION');
      }
    }

    const now = new Date();
    const updateValues: Updateable<Database['inventory_items']> = {
      status: toStatus,
      updated_at: now,
    };
    if (options.note !== undefined) {
      updateValues.notes = options.note;
    }

    const updated = await this.inventoryRepository.updateStatus(db, itemId, updateValues);
    if (!updated) {
      throwNotFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
    }

    await this.auditService.write(
      {
        action: 'INVENTORY_STATUS_UPDATED',
        entityType: 'inventory_item',
        entityId: updated.id,
        actorStaffId: options.actorStaffId ?? null,
        actorDeviceId: options.actorDeviceId ?? null,
        metadata: {
          fromStatus: current.status,
          toStatus,
          note: options.note ?? null,
          source: options.source ?? 'MANUAL',
        },
      },
      db
    );

    return { updated, fromStatus: current.status };
  }

  private toDto(item: Selectable<Database['inventory_items']>): InventoryItemDto {
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      status: item.status,
      notes: item.notes ?? null,
      updatedAt: item.updated_at.toISOString(),
    };
  }
}
