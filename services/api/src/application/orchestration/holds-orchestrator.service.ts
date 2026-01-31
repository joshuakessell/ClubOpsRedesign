import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { throwConflict, throwNotFound } from '../../platform/http/errors';
import { AssignmentsService } from '../../domains/assignments/assignments.service';
import { HoldsService } from '../../domains/holds/holds.service';
import { InventoryService } from '../../domains/inventory/inventory.service';
import { VisitsReadService } from '../../domains/visits/visits.read.service';
import { WaitlistReadService } from '../../domains/waitlist/waitlist.read.service';
import type { CreateHoldRequestDto } from '../../domains/holds/dto/hold-requests.dto';
import type { HoldDto } from '../../domains/holds/dto/hold.dto';

@Injectable()
export class HoldsOrchestratorService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly holdsService: HoldsService,
    private readonly inventoryService: InventoryService,
    private readonly assignmentsService: AssignmentsService,
    private readonly visitsReadService: VisitsReadService,
    private readonly waitlistReadService: WaitlistReadService
  ) {}

  async create(
    request: CreateHoldRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<HoldDto> {
    return this.databaseService.transaction(async (trx) => {
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

      if (request.inventoryItemId) {
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
      }

      const created = await this.holdsService.createInTransaction(trx, request, actor);
      return this.holdsService.toDto(created);
    });
  }

  async release(holdId: string, actor: { staffId: string; deviceId: string }): Promise<HoldDto> {
    return this.holdsService.release(holdId, actor);
  }
}
