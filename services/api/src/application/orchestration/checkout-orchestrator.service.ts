import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { throwNotFound, throwValidation } from '../../platform/http/errors';
import { AssignmentsService } from '../../domains/assignments/assignments.service';
import { CheckoutService } from '../../domains/checkout/checkout.service';
import { InventoryService } from '../../domains/inventory/inventory.service';
import { VisitsService } from '../../domains/visits/visits.service';
import type { CheckoutRequestDto } from '../../domains/checkout/dto/checkout-requests.dto';
import type { CheckoutEventDto } from '../../domains/checkout/dto/checkout.dto';

@Injectable()
export class CheckoutOrchestratorService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly checkoutService: CheckoutService,
    private readonly visitsService: VisitsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly inventoryService: InventoryService
  ) {}

  async request(
    visitId: string,
    request: CheckoutRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<CheckoutEventDto> {
    if (!visitId) {
      throwValidation('visitId is required');
    }

    const created = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsService.getByIdForUpdate(trx, visitId);
      if (!visit) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      return this.checkoutService.createRequestInTransaction(trx, visitId, request, actor);
    });

    return this.checkoutService.toDto(created);
  }

  async complete(visitId: string, actor: { staffId: string; deviceId: string }): Promise<CheckoutEventDto> {
    if (!visitId) {
      throwValidation('visitId is required');
    }

    const updated = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsService.getByIdForUpdate(trx, visitId);
      if (!visit) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      await this.checkoutService.ensureNotCompleted(trx, visitId);

      const assignment = await this.assignmentsService.findActiveByVisit(trx, visitId);
      if (assignment) {
        await this.assignmentsService.releaseByVisit(trx, visitId);
        await this.inventoryService.transitionStatus(trx, assignment.inventory_item_id, 'DIRTY', {
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          allowAny: true,
          source: 'CHECKOUT_COMPLETE',
          note: 'Checkout completed',
        });
      }

      await this.visitsService.closeVisit(trx, visitId, {
        staffId: actor.staffId,
        deviceId: actor.deviceId,
      });

      return this.checkoutService.completeInTransaction(trx, visitId, actor);
    });

    return this.checkoutService.toDto(updated);
  }
}
