import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { HoldsService } from '../holds/holds.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { InventoryService } from '../inventory/inventory.service';
import { VisitsService } from '../visits/visits.service';
import { UpgradesRepository } from './upgrades.repository';
import type { CreateUpgradeOfferRequestDto } from './dto/upgrade-requests.dto';
import type { UpgradeOfferDto, UpgradeStatus } from './dto/upgrade.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class UpgradesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly upgradesRepository: UpgradesRepository,
    private readonly visitsService: VisitsService,
    private readonly holdsService: HoldsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService
  ) {}

  async createOffer(
    request: CreateUpgradeOfferRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<UpgradeOfferDto> {
    if (!request.visitId || !request.fromInventoryItemId) {
      throwValidation('visitId and fromInventoryItemId are required');
    }
    if (!['room', 'locker'].includes(request.toInventoryType)) {
      throwValidation('toInventoryType must be room or locker');
    }
    const expiresAt = new Date(request.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throwValidation('expiresAt must be a valid ISO timestamp');
    }

    try {
      const created = await this.databaseService.transaction(async (trx) => {
        const visit = await this.visitsService.getByIdForUpdate(trx, request.visitId);
        if (!visit || visit.status !== 'ACTIVE') {
          throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
        }

        const offer = await this.upgradesRepository.create(trx, {
          visit_id: request.visitId,
          from_inventory_item_id: request.fromInventoryItemId,
          to_inventory_type: request.toInventoryType,
          status: 'PENDING',
          expires_at: expiresAt,
          created_at: new Date(),
        });

        await this.auditService.write(
          {
            action: 'UPGRADE_OFFERED',
            entityType: 'upgrade_offer',
            entityId: offer.id,
            actorStaffId: actor.staffId,
            actorDeviceId: actor.deviceId,
            metadata: {
              visitId: offer.visit_id,
              toInventoryType: offer.to_inventory_type,
            },
          },
          trx
        );

        return offer;
      });

      return this.toDto(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throwConflict('Upgrade offer already exists', 'UPGRADE_ALREADY_DECIDED');
      }
      throw error;
    }
  }

  async accept(
    offerId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<UpgradeOfferDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const offer = await this.upgradesRepository.findById(trx, offerId);
      if (!offer) {
        throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
      }
      if (offer.status !== 'PENDING') {
        throwConflict('Upgrade offer already decided', 'UPGRADE_ALREADY_DECIDED');
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

      const currentAssignment = await this.assignmentsService.findActiveByVisit(trx, offer.visit_id);
      if (!currentAssignment) {
        throwConflict('Visit has no active assignment', 'HOLD_CONFLICT');
      }

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

      const next = await this.upgradesRepository.update(trx, offer.id, {
        status: 'ACCEPTED',
      });

      await this.auditService.write(
        {
          action: 'UPGRADE_ACCEPTED',
          entityType: 'upgrade_offer',
          entityId: offer.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            visitId: offer.visit_id,
          },
        },
        trx
      );

      return next!;
    });

    return this.toDto(updated);
  }

  async decline(
    offerId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<UpgradeOfferDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const offer = await this.upgradesRepository.findById(trx, offerId);
      if (!offer) {
        throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
      }
      if (offer.status !== 'PENDING') {
        throwConflict('Upgrade offer already decided', 'UPGRADE_ALREADY_DECIDED');
      }

      const next = await this.upgradesRepository.update(trx, offer.id, {
        status: 'DECLINED',
      });

      await this.auditService.write(
        {
          action: 'UPGRADE_DECLINED',
          entityType: 'upgrade_offer',
          entityId: offer.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            visitId: offer.visit_id,
          },
        },
        trx
      );

      return next!;
    });

    return this.toDto(updated);
  }

  private toDto(row: Selectable<Database['upgrade_offers']>): UpgradeOfferDto {
    return {
      id: row.id,
      visitId: row.visit_id,
      fromInventoryItemId: row.from_inventory_item_id,
      toInventoryType: row.to_inventory_type,
      status: row.status as UpgradeStatus,
      expiresAt: row.expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
    };
  }
}
