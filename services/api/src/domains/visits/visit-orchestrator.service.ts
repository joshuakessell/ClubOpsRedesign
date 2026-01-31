import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { InventoryService } from '../inventory/inventory.service';
import { VisitsRepository } from './visits.repository';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';
import type { VisitAssignmentDto, VisitDto } from './dto/visit.dto';
import { VisitsService } from './visits.service';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class VisitOrchestratorService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly visitsRepository: VisitsRepository,
    private readonly visitsService: VisitsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService
  ) {}

  async assignInventory(
    visitId: string,
    inventoryItemId: string,
    actor: { staffId: string; deviceId: string; role: 'staff' | 'admin' }
  ): Promise<VisitAssignmentDto> {
    if (!inventoryItemId) {
      throwValidation('inventoryItemId is required');
    }

    try {
      const assignment = await this.databaseService.transaction(async (trx) => {
        const visit = await this.visitsRepository.findByIdForUpdate(trx, visitId);
        if (!visit || visit.status !== 'ACTIVE') {
          throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
        }

        const { updated: inventoryItem, fromStatus } = await this.inventoryService.transitionStatus(
          trx,
          inventoryItemId,
          'OCCUPIED',
          {
            actorStaffId: actor.staffId,
            actorDeviceId: actor.deviceId,
            allowAny: true,
            source: 'VISIT_ASSIGNMENT',
          }
        );

        if (fromStatus !== 'AVAILABLE') {
          throwConflict('Inventory item is not available', 'INVENTORY_UNAVAILABLE_FOR_ASSIGNMENT');
        }

        const created = await this.assignmentsService.create(trx, visit.id, inventoryItemId);

        await this.auditService.write(
          {
            action: 'VISIT_ASSIGNED',
            entityType: 'visit',
            entityId: visit.id,
            actorStaffId: actor.staffId,
            actorDeviceId: actor.deviceId,
            metadata: {
              inventoryItemId: inventoryItem.id,
            },
          },
          trx
        );

        return created;
      });

      return this.assignmentsService.toDto(assignment);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throwConflict('Inventory item is not available', 'INVENTORY_UNAVAILABLE_FOR_ASSIGNMENT');
      }
      throw error;
    }
  }

  async closeVisit(
    visitId: string,
    actor: { staffId: string; deviceId: string; role: 'staff' | 'admin' }
  ): Promise<VisitDto> {
    const closed: Selectable<Database['visits']> = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsRepository.findByIdForUpdate(trx, visitId);
      if (!visit) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      if (visit.status === 'CLOSED') {
        return visit;
      }

      const assignment = await this.assignmentsService.findActiveByVisit(trx, visitId);
      if (assignment) {
        await this.assignmentsService.releaseByVisit(trx, visitId);
        const inventoryItem = await this.inventoryService.findByIdForUpdate(
          trx,
          assignment.inventory_item_id
        );
        if (inventoryItem && inventoryItem.status !== 'DIRTY') {
          await this.inventoryService.transitionStatus(trx, assignment.inventory_item_id, 'DIRTY', {
            actorStaffId: actor.staffId,
            actorDeviceId: actor.deviceId,
            allowAny: true,
            source: 'VISIT_CLOSE',
            note: 'Released on visit close',
          });
        }
      }

      return this.visitsService.closeVisit(trx, visitId, {
        staffId: actor.staffId,
        deviceId: actor.deviceId,
      });
    });

    return this.visitsService.toDto(closed);
  }
}
