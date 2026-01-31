import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { InventoryService } from '../inventory/inventory.service';
import { VisitsService } from '../visits/visits.service';
import { CheckoutRepository } from './checkout.repository';
import type { CheckoutRequestDto } from './dto/checkout-requests.dto';
import type { CheckoutEventDto, CheckoutMethod } from './dto/checkout.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly visitsService: VisitsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService
  ) {}

  async request(
    visitId: string,
    request: CheckoutRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<CheckoutEventDto> {
    if (!visitId) {
      throwValidation('visitId is required');
    }
    if (!request.method || !['KIOSK', 'REGISTER', 'ADMIN'].includes(request.method)) {
      throwValidation('method must be KIOSK, REGISTER, or ADMIN');
    }

    const created = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsService.getByIdForUpdate(trx, visitId);
      if (!visit) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      const event = await this.checkoutRepository.create(trx, {
        visit_id: visitId,
        requested_at: new Date(),
        completed_at: null,
        method: request.method as CheckoutMethod,
      });

      await this.auditService.write(
        {
          action: 'CHECKOUT_REQUESTED',
          entityType: 'checkout_event',
          entityId: event.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            visitId,
          },
        },
        trx
      );

      return event;
    });

    return this.toDto(created);
  }

  async complete(
    visitId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<CheckoutEventDto> {
    const updated = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsService.getByIdForUpdate(trx, visitId);
      if (!visit) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      const latest = await this.checkoutRepository.findLatestByVisit(trx, visitId);
      if (latest && latest.completed_at) {
        throwConflict('Checkout already completed', 'CHECKOUT_ALREADY_COMPLETED');
      }

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

      const event = latest
        ? await this.checkoutRepository.update(trx, latest.id, { completed_at: new Date() })
        : await this.checkoutRepository.create(trx, {
            visit_id: visitId,
            requested_at: new Date(),
            completed_at: new Date(),
            method: 'REGISTER',
          });

      await this.auditService.write(
        {
          action: 'CHECKOUT_COMPLETED',
          entityType: 'checkout_event',
          entityId: event?.id ?? visitId,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            visitId,
          },
        },
        trx
      );

      return event!;
    });

    return this.toDto(updated);
  }

  private toDto(row: Selectable<Database['checkout_events']>): CheckoutEventDto {
    return {
      id: row.id,
      visitId: row.visit_id,
      requestedAt: row.requested_at.toISOString(),
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
      method: row.method as CheckoutMethod,
    };
  }
}
