import { Injectable } from '@nestjs/common';
import type { Kysely, Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import { AuditService } from '../audit/audit.service';
import { CheckoutRepository } from './checkout.repository';
import type { CheckoutRequestDto } from './dto/checkout-requests.dto';
import type { CheckoutEventDto, CheckoutMethod } from './dto/checkout.dto';
import { throwConflict, throwValidation } from '../../platform/http/errors';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly auditService: AuditService
  ) {}

  async createRequestInTransaction(
    db: Kysely<Database>,
    visitId: string,
    request: CheckoutRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<Selectable<Database['checkout_events']>> {
    if (!visitId) {
      throwValidation('visitId is required');
    }
    if (!request.method || !['KIOSK', 'REGISTER', 'ADMIN'].includes(request.method)) {
      throwValidation('method must be KIOSK, REGISTER, or ADMIN');
    }

    const event = await this.checkoutRepository.create(db, {
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
      db
    );

    return event;
  }

  async ensureNotCompleted(db: Kysely<Database>, visitId: string): Promise<void> {
    const latest = await this.checkoutRepository.findLatestByVisit(db, visitId);
    if (latest && latest.completed_at) {
      throwConflict('Checkout already completed', 'CHECKOUT_ALREADY_COMPLETED');
    }
  }

  async completeInTransaction(
    db: Kysely<Database>,
    visitId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<Selectable<Database['checkout_events']>> {
    const latest = await this.checkoutRepository.findLatestByVisit(db, visitId);
    if (latest && latest.completed_at) {
      throwConflict('Checkout already completed', 'CHECKOUT_ALREADY_COMPLETED');
    }

    const event = latest
      ? await this.checkoutRepository.update(db, latest.id, { completed_at: new Date() })
      : await this.checkoutRepository.create(db, {
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
      db
    );

    return event!;
  }

  toDto(row: Selectable<Database['checkout_events']>): CheckoutEventDto {
    return {
      id: row.id,
      visitId: row.visit_id,
      requestedAt: row.requested_at.toISOString(),
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
      method: row.method as CheckoutMethod,
    };
  }
}
