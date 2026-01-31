import { HttpException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { CleaningRepository } from './cleaning.repository';
import { InventoryService } from '../inventory/inventory.service';
import { KeysReadService } from '../keys/keys.read.service';
import type { CleaningBatchRequestDto, CleaningBatchResponseDto, CleaningBatchResultDto, CleaningTargetStatus } from './dto/cleaning.dto';
import { throwValidation } from '../../platform/http/errors';

@Injectable()
export class CleaningService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cleaningRepository: CleaningRepository,
    private readonly inventoryService: InventoryService,
    private readonly keysReadService: KeysReadService
  ) {}

  async createBatch(
    request: CleaningBatchRequestDto,
    actor: { staffId: string; deviceId: string; role: 'staff' | 'admin' }
  ): Promise<CleaningBatchResponseDto> {
    if (!request.toStatus || !['CLEANING', 'AVAILABLE'].includes(request.toStatus)) {
      throwValidation('toStatus must be CLEANING or AVAILABLE');
    }

    const mode = this.resolveMode(request);
    if (!mode) {
      throwValidation('itemIds or tagCodes must be provided');
    }

    const batch = await this.cleaningRepository.createBatch(this.databaseService.client, {
      created_by_staff_id: actor.staffId,
      created_at: new Date(),
    });

    const results: CleaningBatchResultDto[] = [];

    if (mode.kind === 'tagCodes') {
      for (const tagCode of mode.values) {
        const resolved = await this.resolveTag(tagCode);
        if (!resolved.ok) {
          results.push({ itemId: null, tagCode, status: resolved.status, message: resolved.message });
          continue;
        }
        const result = await this.transitionItem(batch.id, resolved.itemId, request.toStatus, actor);
        results.push({ ...result, tagCode });
      }
    } else {
      for (const itemId of mode.values) {
        const result = await this.transitionItem(batch.id, itemId, request.toStatus, actor);
        results.push({ ...result, tagCode: null });
      }
    }

    return { batchId: batch.id, results };
  }

  private resolveMode(
    request: CleaningBatchRequestDto
  ): { kind: 'tagCodes' | 'itemIds'; values: string[] } | null {
    const tagCodes = request.tagCodes?.filter((value) => value.trim().length > 0) ?? [];
    if (tagCodes.length > 0) {
      return { kind: 'tagCodes', values: tagCodes };
    }
    const itemIds = request.itemIds?.filter((value) => value.trim().length > 0) ?? [];
    if (itemIds.length > 0) {
      return { kind: 'itemIds', values: itemIds };
    }
    return null;
  }

  private async resolveTag(
    tagCode: string
  ): Promise<{ ok: true; itemId: string } | { ok: false; status: 'FAILED' | 'SKIPPED'; message: string }> {
    const tag = await this.keysReadService.findByTagCode(tagCode);
    if (!tag) {
      return { ok: false, status: 'FAILED', message: 'Key tag not found' };
    }
    if (!tag.enabled) {
      return { ok: false, status: 'FAILED', message: 'Key tag disabled' };
    }
    if (!tag.assigned_to_item_id) {
      return { ok: false, status: 'SKIPPED', message: 'Key tag not assigned to an item' };
    }
    return { ok: true, itemId: tag.assigned_to_item_id };
  }

  private async transitionItem(
    batchId: string,
    itemId: string,
    toStatus: CleaningTargetStatus,
    actor: { staffId: string; deviceId: string; role: 'staff' | 'admin' }
  ): Promise<Omit<CleaningBatchResultDto, 'tagCode'>> {
    try {
      const outcome = await this.databaseService.transaction(async (trx) => {
        const { updated, fromStatus } = await this.inventoryService.transitionStatus(trx, itemId, toStatus, {
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          allowAny: actor.role === 'admin',
          source: 'CLEANING_BATCH',
        });

        await this.cleaningRepository.createBatchItem(trx, {
          batch_id: batchId,
          inventory_item_id: updated.id,
          from_status: fromStatus,
          to_status: updated.status,
          created_at: new Date(),
        });

        return updated;
      });

      return { itemId: outcome.id, status: 'UPDATED' };
    } catch (error) {
      if (error instanceof HttpException) {
        const response = error.getResponse() as { message?: string };
        const message = typeof response?.message === 'string' ? response.message : 'Unable to update item';
        return { itemId, status: 'FAILED', message };
      }
      return { itemId, status: 'FAILED', message: 'Unable to update item' };
    }
  }
}
