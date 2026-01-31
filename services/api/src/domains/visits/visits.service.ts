import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { CustomersReadService } from '../customers/customers.read.service';
import { VisitRenewalsRepository } from './visit-renewals.repository';
import { VisitsRepository } from './visits.repository';
import type { OpenVisitRequestDto, RenewVisitRequestDto } from './dto/visit-requests.dto';
import type { VisitDto } from './dto/visit.dto';
import type { Kysely, Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';

const INITIAL_DURATION_MINUTES = 360;
const MAX_TOTAL_DURATION_MINUTES = 840;

@Injectable()
export class VisitsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly visitsRepository: VisitsRepository,
    private readonly visitRenewalsRepository: VisitRenewalsRepository,
    private readonly customersReadService: CustomersReadService,
    private readonly auditService: AuditService
  ) {}

  async open(
    request: OpenVisitRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<VisitDto> {
    if (!request.customerId) {
      throwValidation('customerId is required');
    }

    const customer = await this.customersReadService.findById(request.customerId);
    if (!customer) {
      throwNotFound('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const existing = await this.visitsRepository.findActiveByCustomerId(
      this.databaseService.client,
      request.customerId
    );
    if (existing) {
      throwConflict('Customer already has an active visit', 'VISIT_ALREADY_ACTIVE');
    }

    const startedAt = new Date();
    const plannedEndAt = new Date(startedAt.getTime() + INITIAL_DURATION_MINUTES * 60 * 1000);

    const created = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsRepository.create(trx, {
        customer_id: request.customerId,
        status: 'ACTIVE',
        started_at: startedAt,
        planned_end_at: plannedEndAt,
        closed_at: null,
        initial_duration_minutes: INITIAL_DURATION_MINUTES,
        max_total_duration_minutes: MAX_TOTAL_DURATION_MINUTES,
        renewal_total_minutes: 0,
        created_by_staff_id: actor.staffId,
      });

      await this.auditService.write(
        {
          action: 'VISIT_OPENED',
          entityType: 'visit',
          entityId: visit.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            customerId: request.customerId,
            plannedEndAt: plannedEndAt.toISOString(),
          },
        },
        trx
      );

      return visit;
    });

    return this.toDto(created);
  }

  async renew(
    visitId: string,
    request: RenewVisitRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<VisitDto> {
    if (!request.durationMinutes || ![120, 360].includes(request.durationMinutes)) {
      throwValidation('durationMinutes must be 120 or 360');
    }

    const updated = await this.databaseService.transaction(async (trx) => {
      const visit = await this.visitsRepository.findByIdForUpdate(trx, visitId);
      if (!visit || visit.status !== 'ACTIVE') {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      const nextTotal = visit.initial_duration_minutes + visit.renewal_total_minutes + request.durationMinutes;
      if (nextTotal > visit.max_total_duration_minutes) {
        throwConflict('Visit cannot be renewed beyond max duration', 'VISIT_MAX_DURATION_EXCEEDED');
      }

      const plannedEndAt = new Date(visit.started_at.getTime() + nextTotal * 60 * 1000);

      await this.visitRenewalsRepository.create(trx, {
        visit_id: visit.id,
        duration_minutes: request.durationMinutes,
        created_by_staff_id: actor.staffId,
        created_at: new Date(),
      });

      const next = await this.visitsRepository.update(trx, visit.id, {
        planned_end_at: plannedEndAt,
        renewal_total_minutes: visit.renewal_total_minutes + request.durationMinutes,
      });

      if (!next) {
        throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
      }

      await this.auditService.write(
        {
          action: 'VISIT_RENEWED',
          entityType: 'visit',
          entityId: visit.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            durationMinutes: request.durationMinutes,
            plannedEndAt: plannedEndAt.toISOString(),
          },
        },
        trx
      );

      return next;
    });

    return this.toDto(updated);
  }

  async getActiveByCustomerId(customerId: string): Promise<VisitDto | null> {
    if (!customerId) {
      throwValidation('customerId is required');
    }
    const customer = await this.customersReadService.findById(customerId);
    if (!customer) {
      throwNotFound('Customer not found', 'CUSTOMER_NOT_FOUND');
    }
    const visit = await this.visitsRepository.findActiveByCustomerId(
      this.databaseService.client,
      customerId
    );
    return visit ? this.toDto(visit) : null;
  }

  async getByIdForUpdate(db: Kysely<Database>, visitId: string) {
    return this.visitsRepository.findByIdForUpdate(db, visitId);
  }

  async closeVisit(
    db: Kysely<Database>,
    visitId: string,
    actor: { staffId: string; deviceId: string }
  ) {
    const visit = await this.visitsRepository.findByIdForUpdate(db, visitId);
    if (!visit) {
      throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
    }
    if (visit.status === 'CLOSED') {
      return visit;
    }

    const updated = await this.visitsRepository.update(db, visitId, {
      status: 'CLOSED',
      closed_at: new Date(),
    });

    if (!updated) {
      throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
    }

    await this.auditService.write(
      {
        action: 'VISIT_CLOSED',
        entityType: 'visit',
        entityId: updated.id,
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        metadata: {
          closedAt: updated.closed_at?.toISOString(),
        },
      },
      db
    );

    return updated;
  }

  toDto(visit: Selectable<Database['visits']>): VisitDto {
    return {
      id: visit.id,
      customerId: visit.customer_id,
      status: visit.status,
      startedAt: visit.started_at.toISOString(),
      plannedEndAt: visit.planned_end_at.toISOString(),
      closedAt: visit.closed_at ? visit.closed_at.toISOString() : null,
      initialDurationMinutes: visit.initial_duration_minutes,
      maxTotalDurationMinutes: visit.max_total_duration_minutes,
      renewalTotalMinutes: visit.renewal_total_minutes,
    };
  }
}
