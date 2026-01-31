import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { VisitsReadService } from '../visits/visits.read.service';
import { AgreementsRepository } from './agreements.repository';
import type { CaptureAgreementRequestDto } from './dto/agreement-requests.dto';
import type { AgreementDto } from './dto/agreement.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class AgreementsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly agreementsRepository: AgreementsRepository,
    private readonly visitsReadService: VisitsReadService,
    private readonly auditService: AuditService
  ) {}

  async capture(
    visitId: string,
    request: CaptureAgreementRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<AgreementDto> {
    if (!visitId) {
      throwValidation('visitId is required');
    }
    if (!request.status || !['SIGNED', 'BYPASSED'].includes(request.status)) {
      throwValidation('status must be SIGNED or BYPASSED');
    }
    if (!request.method || !['KIOSK', 'REGISTER', 'ADMIN'].includes(request.method)) {
      throwValidation('method must be KIOSK, REGISTER, or ADMIN');
    }

    const visit = await this.visitsReadService.findById(visitId);
    if (!visit) {
      throwNotFound('Visit not found', 'VISIT_NOT_FOUND');
    }

    const agreement = await this.databaseService.transaction(async (trx) => {
      const existing = await this.agreementsRepository.findByVisitId(trx, visitId);
      if (existing) {
        throwConflict('Agreement already captured', 'AGREEMENT_ALREADY_CAPTURED');
      }

      const created = await this.agreementsRepository.create(trx, {
        visit_id: visitId,
        status: request.status,
        captured_at: new Date(),
        method: request.method,
        metadata: request.metadata ?? {},
      });

      await this.auditService.write(
        {
          action: 'AGREEMENT_CAPTURED',
          entityType: 'agreement',
          entityId: created.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            visitId,
            status: created.status,
            method: created.method,
          },
        },
        trx
      );

      return created;
    });

    return this.toDto(agreement);
  }

  private toDto(agreement: Selectable<Database['agreements']>): AgreementDto {
    return {
      id: agreement.id,
      visitId: agreement.visit_id,
      status: agreement.status,
      capturedAt: agreement.captured_at.toISOString(),
      method: agreement.method,
      metadata: agreement.metadata ?? {},
    };
  }
}
