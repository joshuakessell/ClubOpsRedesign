import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { DOMAIN_EVENTS_PUBLISHER } from '../../platform/events/events.module';
import type { DomainEventsPublisher } from '../../platform/events/domain-events.publisher';
import { AuditService } from '../audit/audit.service';
import { RegisterSessionsRepository } from './register-sessions.repository';
import type { RegisterNumber, RegisterSessionDto } from './dto/register-session.dto';
import type { CloseRegisterSessionRequestDto, ForceSignOutRequestDto, OpenRegisterSessionRequestDto } from './dto/register-session-requests.dto';
import type { RegisterAvailabilityResponseDto } from './dto/register-availability.dto';
import { throwConflict, throwForbidden, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';
import { ConfigService } from '../../platform/config/config.service';

@Injectable()
export class RegisterSessionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly registerSessionsRepository: RegisterSessionsRepository,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    @Inject(DOMAIN_EVENTS_PUBLISHER) private readonly eventsPublisher: DomainEventsPublisher
  ) {}

  async getAvailability(): Promise<RegisterAvailabilityResponseDto> {
    const registerNumbers: RegisterNumber[] = [1, 2, 3];
    const active = await this.registerSessionsRepository.listActiveByRegisters(
      this.databaseService.client,
      registerNumbers
    );
    const activeMap = new Map(active.map((session) => [session.register_number, session.id]));
    return {
      registers: registerNumbers.map((registerNumber) => ({
        registerNumber,
        available: !activeMap.has(registerNumber),
        activeSessionId: activeMap.get(registerNumber) ?? null,
      })),
    };
  }

  async openSession(
    _request: OpenRegisterSessionRequestDto,
    staffId: string,
    deviceId: string
  ): Promise<RegisterSessionDto> {
    const registerNumber = _request.registerNumber;
    if (![1, 2, 3].includes(registerNumber)) {
      throwValidation('registerNumber must be 1, 2, or 3');
    }
    if (!staffId || !deviceId) {
      throwValidation('staffId and deviceId are required');
    }

    const now = new Date();
    try {
      const session = await this.databaseService.transaction(async (trx) => {
        const created = await this.registerSessionsRepository.createActiveSession(trx, {
          register_number: registerNumber,
          staff_id: staffId,
          device_id: deviceId,
          started_at: now,
          last_heartbeat_at: now,
          signed_out_at: null,
          signed_out_reason: null,
          signed_out_by_staff_id: null,
        });

        await this.auditService.write(
          {
            action: 'REGISTER_SESSION_OPENED',
            entityType: 'register_session',
            entityId: created.id,
            actorStaffId: staffId,
            actorDeviceId: deviceId,
            metadata: { registerNumber },
          },
          trx
        );

        return created;
      });

      await this.eventsPublisher.publishRegisterSessionUpdated({
        sessionId: session.id,
        registerNumber: session.register_number,
        deviceId: session.device_id,
        staffId: session.staff_id,
        status: 'ACTIVE',
        occurredAt: new Date().toISOString(),
      });

      return this.toDto(session);
    } catch (error) {
      if (isUniqueViolation(error)) {
        if (error.constraint === 'register_sessions_active_register_uq') {
          throwConflict('Register already has an active session', 'REGISTER_ACTIVE_CONFLICT');
        }
        if (error.constraint === 'register_sessions_active_device_uq') {
          throwConflict('Device already has an active session', 'DEVICE_ACTIVE_CONFLICT');
        }
      }
      throw error;
    }
  }

  async heartbeat(sessionId: string, deviceId: string): Promise<RegisterSessionDto> {
    const db = this.databaseService.client;
    const session = await db
      .selectFrom('register_sessions')
      .selectAll()
      .where('id', '=', sessionId)
      .executeTakeFirst();
    if (!session) {
      throwNotFound('Register session not found', 'REGISTER_SESSION_NOT_FOUND');
    }
    if (session.signed_out_at) {
      throwConflict('Register session is not active', 'REGISTER_SESSION_NOT_ACTIVE');
    }
    if (session.device_id !== deviceId) {
      throwForbidden('Device does not match session', 'FORBIDDEN');
    }

    const updated = await this.registerSessionsRepository.updateHeartbeat(db, sessionId);
    if (!updated) {
      throwConflict('Register session is not active', 'REGISTER_SESSION_NOT_ACTIVE');
    }

    await this.eventsPublisher.publishRegisterSessionUpdated({
      sessionId: updated.id,
      registerNumber: updated.register_number,
      deviceId: updated.device_id,
      staffId: updated.staff_id,
      status: 'ACTIVE',
      occurredAt: new Date().toISOString(),
    });

    return this.toDto(updated);
  }

  async closeSession(
    sessionId: string,
    _request: CloseRegisterSessionRequestDto,
    staffId: string,
    deviceId: string
  ): Promise<RegisterSessionDto> {
    if (_request.reason === 'OTHER' && !_request.note) {
      throwValidation('note is required when reason is OTHER');
    }
    if (!staffId || !deviceId) {
      throwValidation('staffId and deviceId are required');
    }

    const db = this.databaseService.client;
    const session = await db
      .selectFrom('register_sessions')
      .selectAll()
      .where('id', '=', sessionId)
      .executeTakeFirst();
    if (!session) {
      throwNotFound('Register session not found', 'REGISTER_SESSION_NOT_FOUND');
    }
    if (session.signed_out_at) {
      throwConflict('Register session already closed', 'REGISTER_SESSION_NOT_ACTIVE');
    }
    if (session.device_id !== deviceId) {
      throwForbidden('Device does not match session', 'FORBIDDEN');
    }
    if (session.staff_id !== staffId) {
      throwForbidden('Only the opening staff member can close this session', 'FORBIDDEN');
    }

    const updated = await this.databaseService.transaction(async (trx) => {
      const closed = await this.registerSessionsRepository.closeSession(
        trx,
        sessionId,
        'STAFF_CLOSED',
        staffId
      );
      if (!closed) {
        throwConflict('Register session already closed', 'REGISTER_SESSION_NOT_ACTIVE');
      }
      await this.auditService.write(
        {
          action: 'REGISTER_SESSION_CLOSED',
          entityType: 'register_session',
          entityId: closed.id,
          actorStaffId: staffId,
          actorDeviceId: deviceId,
          metadata: { reason: _request.reason, note: _request.note ?? null },
        },
        trx
      );
      return closed;
    });

    await this.eventsPublisher.publishRegisterSessionUpdated({
      sessionId: updated.id,
      registerNumber: updated.register_number,
      deviceId: updated.device_id,
      staffId: updated.staff_id,
      status: 'ENDED',
      endedReason: 'STAFF_CLOSED',
      occurredAt: new Date().toISOString(),
    });

    return this.toDto(updated, 'STAFF_CLOSED');
  }

  async forceSignOut(
    registerNumber: RegisterNumber,
    _request: ForceSignOutRequestDto,
    adminStaffId: string | null
  ): Promise<RegisterSessionDto> {
    if (_request.reason === 'OTHER' && !_request.note) {
      throwValidation('note is required when reason is OTHER');
    }

    const db = this.databaseService.client;
    const active = await this.registerSessionsRepository.findActiveByRegisterNumber(db, registerNumber);
    if (!active) {
      const latest = await db
        .selectFrom('register_sessions')
        .selectAll()
        .where('register_number', '=', registerNumber)
        .orderBy('started_at', 'desc')
        .executeTakeFirst();
      if (!latest) {
        throwNotFound('Register session not found', 'REGISTER_SESSION_NOT_FOUND');
      }
      return this.toDto(latest);
    }

    const updated = await this.databaseService.transaction(async (trx) => {
      const closed = await this.registerSessionsRepository.closeSession(
        trx,
        active.id,
        'FORCED_SIGN_OUT',
        adminStaffId ?? null
      );
      if (!closed) {
        throwConflict('Register session already closed', 'REGISTER_SESSION_NOT_ACTIVE');
      }
      await this.auditService.write(
        {
          action: 'REGISTER_SESSION_FORCE_SIGNOUT',
          entityType: 'register_session',
          entityId: closed.id,
          actorStaffId: adminStaffId ?? null,
          metadata: { reason: _request.reason, note: _request.note ?? null },
        },
        trx
      );
      return closed;
    });

    await this.eventsPublisher.publishRegisterSessionUpdated({
      sessionId: updated.id,
      registerNumber: updated.register_number,
      deviceId: updated.device_id,
      staffId: updated.staff_id,
      status: 'ENDED',
      endedReason: 'FORCED_SIGN_OUT',
      occurredAt: new Date().toISOString(),
    });

    return this.toDto(updated, 'FORCED_SIGN_OUT');
  }

  async forceCloseByDevice(deviceId: string): Promise<void> {
    const sessions = await this.databaseService.transaction(async (trx) => {
      const closed = await this.registerSessionsRepository.forceCloseByDevice(trx, deviceId);
      if (closed.length === 0) return [];
      for (const session of closed) {
        await this.auditService.write(
          {
            action: 'REGISTER_SESSION_FORCE_SIGNOUT',
            entityType: 'register_session',
            entityId: session.id,
            metadata: { reason: 'DEVICE_DISABLED' },
          },
          trx
        );
      }
      return closed;
    });

    for (const session of sessions) {
      await this.eventsPublisher.publishRegisterSessionUpdated({
        sessionId: session.id,
        registerNumber: session.register_number,
        deviceId: session.device_id,
        staffId: session.staff_id,
        status: 'ENDED',
        endedReason: 'FORCED_SIGN_OUT',
        occurredAt: new Date().toISOString(),
      });
    }
  }

  async getActiveByRegisterNumber(registerNumber: RegisterNumber) {
    const db = this.databaseService.client;
    const session = await this.registerSessionsRepository.findActiveByRegisterNumber(db, registerNumber);
    return session ? this.toDto(session) : null;
  }

  async listAdminSlots() {
    const registerNumbers: RegisterNumber[] = [1, 2, 3];
    const active = await this.registerSessionsRepository.listActiveByRegisters(
      this.databaseService.client,
      registerNumbers
    );
    const activeMap = new Map(active.map((session) => [session.register_number, session]));
    return registerNumbers.map((registerNumber) => ({
      registerNumber,
      session: activeMap.has(registerNumber) ? this.toDto(activeMap.get(registerNumber)!) : null,
    }));
  }

  async closeExpiredSessions(): Promise<void> {
    const ttlSeconds = this.configuredTtlSeconds();
    const batchSize = 100;

    while (true) {
      const cutoff = new Date(Date.now() - ttlSeconds * 1000);
      const closedSessions = await this.databaseService.transaction(async (trx) => {
        const candidates = await this.registerSessionsRepository.listExpiredForTtl(trx, cutoff, batchSize);
        const ids = candidates.map((row) => row.id);
        const closed = await this.registerSessionsRepository.closeExpiredSessions(trx, ids);
        for (const session of closed) {
          await this.auditService.write(
            {
              action: 'REGISTER_SESSION_TTL_EXPIRED',
              entityType: 'register_session',
              entityId: session.id,
              metadata: { reason: 'TTL_EXPIRED' },
            },
            trx
          );
        }
        return closed;
      });

      for (const session of closedSessions) {
        await this.eventsPublisher.publishRegisterSessionUpdated({
          sessionId: session.id,
          registerNumber: session.register_number,
          deviceId: session.device_id,
          staffId: session.staff_id,
          status: 'ENDED',
          endedReason: 'TTL_EXPIRED',
          occurredAt: new Date().toISOString(),
        });
      }

      if (closedSessions.length < batchSize) {
        break;
      }
    }
  }

  private configuredTtlSeconds(): number {
    return this.configService.getRegisterSessionTtlSeconds();
  }

  private toDto(session: {
    id: string;
    register_number: RegisterNumber;
    staff_id: string;
    device_id: string;
    started_at: Date;
    last_heartbeat_at: Date;
    signed_out_at: Date | null;
    signed_out_reason: string | null;
  }, endedReasonOverride?: 'STAFF_CLOSED' | 'FORCED_SIGN_OUT' | 'TTL_EXPIRED'): RegisterSessionDto {
    const endedReason =
      endedReasonOverride ??
      (session.signed_out_reason === 'TTL_EXPIRED'
        ? 'TTL_EXPIRED'
        : session.signed_out_reason === 'FORCED_SIGN_OUT'
          ? 'FORCED_SIGN_OUT'
          : session.signed_out_at
            ? 'STAFF_CLOSED'
            : null);

    return {
      id: session.id,
      registerNumber: session.register_number,
      staffId: session.staff_id,
      deviceId: session.device_id,
      status: session.signed_out_at ? 'ENDED' : 'ACTIVE',
      startedAt: session.started_at.toISOString(),
      lastHeartbeatAt: session.last_heartbeat_at.toISOString(),
      endedAt: session.signed_out_at ? session.signed_out_at.toISOString() : null,
      endedReason: endedReason ?? null,
    };
  }
}
