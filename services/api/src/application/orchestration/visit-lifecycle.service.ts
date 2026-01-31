import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../../domains/audit/audit.service';
import { AssignmentsService } from '../../domains/assignments/assignments.service';
import { InventoryService } from '../../domains/inventory/inventory.service';
import { VisitsService } from '../../domains/visits/visits.service';
import type { AssignVisitRequestDto, OpenVisitRequestDto, RenewVisitRequestDto } from '../../domains/visits/dto/visit-requests.dto';
import type { VisitAssignmentDto, VisitDto, VisitNullableResponseDto } from '../../domains/visits/dto/visit.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';

@Injectable()
export class VisitLifecycleService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly visitsService: VisitsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService
  ) {}

  async open(
    request: OpenVisitRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<VisitDto> {
    return this.visitsService.open(request, actor);
  }

  async renew(
    visitId: string,
    request: RenewVisitRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<VisitDto> {
    return this.visitsService.renew(visitId, request, actor);
  }

  async getActive(customerId: string): Promise<VisitNullableResponseDto> {
    const visit = await this.visitsService.getActiveByCustomerId(customerId);
    return { visit };
  }

  async assignInventory(
    visitId: string,
    request: AssignVisitRequestDto,
    actor: { staffId: string; deviceId: string; role: 'staff' | 'admin' }
  ): Promise<VisitAssignmentDto> {
    if (!request.inventoryItemId) {
      throwValidation('inventoryItemId is required');
    }

    try {
      const assignment = await this.databaseService.transaction(async (trx) => {
        const visit = await this.visitsService.getByIdForUpdate(trx, visitId);
        if (!visit || visit.status !== 'ACTIVE') {
          throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
        }

        const currentItem = await this.inventoryService.findByIdForUpdate(trx, request.inventoryItemId);
        if (!currentItem) {
          throwNotFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
        }
        if (currentItem.status !== 'AVAILABLE') {
          throwConflict('Inventory item is not available', 'INVENTORY_UNAVAILABLE_FOR_ASSIGNMENT');
        }

        const { updated: inventoryItem } = await this.inventoryService.transitionStatus(
          trx,
          request.inventoryItemId,
          'OCCUPIED',
          {
            actorStaffId: actor.staffId,
            actorDeviceId: actor.deviceId,
            allowAny: true,
            source: 'VISIT_ASSIGNMENT',
          }
        );

        const created = await this.assignmentsService.create(trx, visit.id, request.inventoryItemId);

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
    const closed = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsService.getByIdForUpdate(trx, visitId);
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
