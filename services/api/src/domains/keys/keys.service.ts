import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { KeysRepository } from './keys.repository';
import { KeysReadService } from './keys.read.service';
import { InventoryReadService } from '../inventory/inventory.read.service';
import type { KeyScanRequestDto, UpdateKeyTagRequestDto } from './dto/key-requests.dto';
import type { KeyScanResponseDto } from './dto/key-scan.dto';
import type { KeyTagDto } from './dto/key-tag.dto';
import { throwConflict, throwForbidden, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';

@Injectable()
export class KeysService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly keysRepository: KeysRepository,
    private readonly keysReadService: KeysReadService,
    private readonly inventoryReadService: InventoryReadService,
    private readonly auditService: AuditService
  ) {}

  async scan(request: KeyScanRequestDto): Promise<KeyScanResponseDto> {
    if (!request.tagCode) {
      throwValidation('tagCode is required');
    }

    const tag = await this.keysReadService.findByTagCode(request.tagCode);
    if (!tag) {
      throwNotFound('Key tag not found', 'KEY_TAG_NOT_FOUND');
    }
    if (!tag.enabled) {
      throwForbidden('Key tag disabled', 'KEY_TAG_DISABLED');
    }

    const item = tag.assigned_to_item_id
      ? await this.inventoryReadService.findDtoById(tag.assigned_to_item_id)
      : null;

    return {
      keyTag: this.toDto(tag),
      item,
    };
  }

  async updateKeyTag(
    tagId: string,
    request: UpdateKeyTagRequestDto,
    actorStaffId: string | null
  ): Promise<KeyTagDto> {
    if (request.enabled === undefined && request.assignedToItemId === undefined) {
      throwValidation('No fields provided for update');
    }

    const updated = await this.databaseService.transaction(async (trx) => {
      const existing = await this.keysRepository.findById(trx, tagId);
      if (!existing) {
        throwNotFound('Key tag not found', 'KEY_TAG_NOT_FOUND');
      }

      let assignedToItemId = existing.assigned_to_item_id;
      if (request.assignedToItemId !== undefined) {
        if (request.assignedToItemId) {
          const item = await this.inventoryReadService.findById(request.assignedToItemId);
          if (!item) {
            throwNotFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
          }
          const existingAssignment = await this.keysRepository.findByAssignedItemId(
            trx,
            request.assignedToItemId
          );
          if (existingAssignment && existingAssignment.id !== tagId) {
            throwConflict('Inventory item already assigned to a key tag', 'KEY_TAG_ASSIGNMENT_CONFLICT');
          }
          assignedToItemId = request.assignedToItemId;
        } else {
          assignedToItemId = null;
        }
      }

      const enabled = request.enabled ?? existing.enabled;

      try {
        const next = await this.keysRepository.update(trx, tagId, {
          enabled,
          assigned_to_item_id: assignedToItemId,
        });

        if (!next) {
          throwNotFound('Key tag not found', 'KEY_TAG_NOT_FOUND');
        }

        await this.auditService.write(
          {
            action: 'KEY_TAG_UPDATED',
            entityType: 'key_tag',
            entityId: next.id,
            actorStaffId,
            metadata: {
              enabled: next.enabled,
              assignedToItemId: next.assigned_to_item_id ?? null,
            },
          },
          trx
        );

        return next;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throwConflict('Inventory item already assigned to a key tag', 'KEY_TAG_ASSIGNMENT_CONFLICT');
        }
        throw error;
      }
    });

    return this.toDto(updated);
  }

  private toDto(tag: {
    id: string;
    tag_code: string;
    assigned_to_item_id: string | null;
    enabled: boolean;
  }): KeyTagDto {
    return {
      id: tag.id,
      tagCode: tag.tag_code,
      assignedToItemId: tag.assigned_to_item_id ?? null,
      enabled: tag.enabled,
    };
  }
}
