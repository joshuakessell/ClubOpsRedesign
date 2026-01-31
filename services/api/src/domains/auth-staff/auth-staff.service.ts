import { Injectable } from '@nestjs/common';
import { StaffReadService } from '../staff/staff.read.service';
import { StaffSessionsRepository } from './staff-sessions.repository';
import type { StaffLoginRequestDto, StaffLoginResponseDto, StaffSessionDto } from './dto/login-pin.dto';
import { ConfigService } from '../../platform/config/config.service';
import { DatabaseService } from '../../platform/database/database.service';
import { hashTokenDeterministic, verifySecretWithSalt } from '../../platform/security/hash';
import { throwForbidden, throwRateLimited, throwUnauthorized, throwValidation } from '../../platform/http/errors';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthStaffService {
  private readonly loginRateLimitWindowMs = 60_000;
  private readonly loginRateLimitMaxAttempts = 10;
  private readonly loginAttempts = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly staffReadService: StaffReadService,
    private readonly staffSessionsRepository: StaffSessionsRepository,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService
  ) {}

  async listStaff(): Promise<{ staff: Array<{ id: string; identifier: string; name: string; role: 'staff' | 'admin' }> }> {
    const staff = await this.staffReadService.listForLogin();
    return { staff };
  }

  async loginWithPin(body: StaffLoginRequestDto, deviceId: string): Promise<StaffLoginResponseDto> {
    if (!deviceId) {
      throwValidation('deviceId is required');
    }
    this.enforceLoginRateLimit(deviceId);
    if (!body.identifier || !body.pin) {
      throwValidation('Identifier and PIN are required');
    }

    const staff = await this.staffReadService.findByIdentifier(body.identifier);
    if (!staff) {
      throwUnauthorized('Invalid credentials', 'STAFF_UNAUTHORIZED');
    }
    if (!staff.enabled) {
      throwForbidden('Staff disabled', 'STAFF_DISABLED');
    }
    const pinValid = verifySecretWithSalt(body.pin, staff.pin_hash);
    if (!pinValid) {
      throwUnauthorized('Invalid credentials', 'STAFF_UNAUTHORIZED');
    }

    const sessionToken = randomBytes(32).toString('hex');
    const sessionTokenHash = hashTokenDeterministic(sessionToken);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.configService.getStaffSessionTtlSeconds() * 1000);

    const session = await this.databaseService.transaction((trx) =>
      this.staffSessionsRepository.createSession(trx, {
        staff_id: staff.id,
        device_id: deviceId,
        session_token_hash: sessionTokenHash,
        created_at: createdAt,
        expires_at: expiresAt,
        revoked_at: null,
      })
    );

    return {
      session: {
        staffId: staff.id,
        role: staff.role,
        deviceId: deviceId,
        createdAt: session.created_at.toISOString(),
        expiresAt: session.expires_at.toISOString(),
      },
      sessionToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    const db = this.databaseService.client;
    const session = await db
      .selectFrom('staff_sessions')
      .select(['session_token_hash'])
      .where('id', '=', sessionId)
      .executeTakeFirst();
    if (!session) return;
    await this.staffSessionsRepository.revokeSession(db, session.session_token_hash);
  }

  async me(sessionId: string): Promise<StaffSessionDto> {
    const db = this.databaseService.client;
    const session = await db
      .selectFrom('staff_sessions')
      .selectAll()
      .where('id', '=', sessionId)
      .executeTakeFirst();
    if (!session) {
      throwUnauthorized('Staff session not found', 'STAFF_UNAUTHORIZED');
    }
    const staff = await this.staffReadService.findById(session.staff_id);
    if (!staff) {
      throwUnauthorized('Staff not found', 'STAFF_UNAUTHORIZED');
    }
    return {
      staffId: staff.id,
      role: staff.role,
      deviceId: session.device_id,
      createdAt: session.created_at.toISOString(),
      expiresAt: session.expires_at.toISOString(),
    };
  }

  async resolveSession(sessionToken: string) {
    if (!sessionToken) {
      throwUnauthorized('Missing session token', 'STAFF_UNAUTHORIZED');
    }
    const sessionTokenHash = hashTokenDeterministic(sessionToken);
    const db = this.databaseService.client;
    const session = await this.staffSessionsRepository.findSessionByToken(db, sessionTokenHash);
    if (!session) {
      throwUnauthorized('Invalid session token', 'STAFF_UNAUTHORIZED');
    }
    if (session.revoked_at) {
      throwUnauthorized('Session revoked', 'STAFF_UNAUTHORIZED');
    }
    if (session.expires_at.getTime() <= Date.now()) {
      throwUnauthorized('Session expired', 'STAFF_SESSION_EXPIRED');
    }
    const staff = await this.staffReadService.findById(session.staff_id);
    if (!staff) {
      throwUnauthorized('Staff not found', 'STAFF_UNAUTHORIZED');
    }
    if (!staff.enabled) {
      throwForbidden('Staff disabled', 'STAFF_DISABLED');
    }
    return {
      sessionId: session.id,
      staffId: staff.id,
      role: staff.role,
      deviceId: session.device_id,
    };
  }

  private enforceLoginRateLimit(deviceId: string): void {
    const now = Date.now();
    const current = this.loginAttempts.get(deviceId);
    if (!current || now >= current.resetAt) {
      this.loginAttempts.set(deviceId, { count: 1, resetAt: now + this.loginRateLimitWindowMs });
      return;
    }
    const nextCount = current.count + 1;
    if (nextCount > this.loginRateLimitMaxAttempts) {
      throwRateLimited('Too many login attempts, please try again later');
    }
    current.count = nextCount;
  }
}
