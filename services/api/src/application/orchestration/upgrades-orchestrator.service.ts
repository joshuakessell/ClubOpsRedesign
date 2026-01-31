import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import { AssignmentsService } from '../../domains/assignments/assignments.service';
import { HoldsService } from '../../domains/holds/holds.service';
import { InventoryService } from '../../domains/inventory/inventory.service';
import { VisitsService } from '../../domains/visits/visits.service';
import { UpgradesService } from '../../domains/upgrades/upgrades.service';
import type { CreateUpgradeOfferRequestDto } from '../../domains/upgrades/dto/upgrade-requests.dto';
import type { UpgradeOfferDto } from '../../domains/upgrades/dto/upgrade.dto';

@Injectable()
export class UpgradesOrchestratorService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly upgradesService: UpgradesService,
    private readonly visitsService: VisitsService,
    private readonly holdsService: HoldsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly inventoryService: InventoryService
  ) {}

  async createOffer(
    request: CreateUpgradeOfferRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<UpgradeOfferDto> {
    if (!request.visitId || !request.fromInventoryItemId) {
      throwValidation('visitId and fromInventoryItemId are required');
    }

    const created = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsService.getByIdForUpdate(trx, request.visitId);
      if (!visit || visit.status !== 'ACTIVE') {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      const assignment = await this.assignmentsService.findActiveByVisit(trx, request.visitId);
      if (!assignment || assignment.inventory_item_id !== request.fromInventoryItemId) {
        throwConflict('Upgrade offer must reference current assignment', 'UPGRADE_INVALID_FROM');
      }

      return this.upgradesService.createOfferInTransaction(trx, request, actor);
    });

    return this.upgradesService.toDto(created);
  }

  async accept(offerId: string, actor: { staffId: string; deviceId: string }): Promise<UpgradeOfferDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const offer = await this.upgradesService.findByIdForUpdate(trx, offerId);
      if (!offer) {
        throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
      }

      await this.upgradesService.ensurePending(trx, offer, actor);

      const currentAssignment = await this.assignmentsService.findActiveByVisit(trx, offer.visit_id);
      if (!currentAssignment || currentAssignment.inventory_item_id !== offer.from_inventory_item_id) {
        throwConflict('Upgrade offer no longer matches current assignment', 'UPGRADE_INVALID_FROM');
      }

      const targetItem = await this.inventoryService.findAvailableByTypeForUpdate(
        trx,
        offer.to_inventory_type
      );
      if (!targetItem) {
        throwConflict('No available inventory for upgrade', 'HOLD_CONFLICT');
      }

      await this.holdsService.createInTransaction(
        trx,
        {
          inventoryItemId: targetItem.id,
          visitId: offer.visit_id,
          expiresAt: offer.expires_at.toISOString(),
        },
        actor
      );

      await this.inventoryService.transitionStatus(trx, currentAssignment.inventory_item_id, 'DIRTY', {
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        allowAny: true,
        source: 'UPGRADE_ACCEPT',
        note: 'Released on upgrade',
      });

      await this.inventoryService.transitionStatus(trx, targetItem.id, 'OCCUPIED', {
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        allowAny: true,
        source: 'UPGRADE_ACCEPT',
      });

      const reassigned = await this.assignmentsService.reassign(trx, offer.visit_id, targetItem.id);
      if (!reassigned) {
        throwConflict('Visit assignment not found', 'HOLD_CONFLICT');
      }

      const next = await this.upgradesService.markAccepted(trx, offer.id, actor);

      await this.holdsService.releaseActiveHoldForInventoryItem(trx, targetItem.id, actor);

      return next;
    });

    return this.upgradesService.toDto(updated);
  }

  async decline(offerId: string, actor: { staffId: string; deviceId: string }): Promise<UpgradeOfferDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const offer = await this.upgradesService.findByIdForUpdate(trx, offerId);
      if (!offer) {
        throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
      }

      await this.upgradesService.ensurePending(trx, offer, actor);

      return this.upgradesService.markDeclined(trx, offer.id, actor);
    });

    return this.upgradesService.toDto(updated);
  }
}
