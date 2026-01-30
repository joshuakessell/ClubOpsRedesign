import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import type { RegisterNumber } from './dto/register-session.dto';

@Injectable()
export class RegisterSessionsRepository {
  async createActiveSession(db: Kysely<Database>, values: Insertable<Database['register_sessions']>) {
    return db
      .insertInto('register_sessions')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateHeartbeat(db: Kysely<Database>, sessionId: string) {
    return db
      .updateTable('register_sessions')
      .set({ last_heartbeat_at: new Date() })
      .where('id', '=', sessionId)
      .where('signed_out_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async closeSession(
    db: Kysely<Database>,
    sessionId: string,
    reason: string,
    endedByStaffId?: string | null
  ) {
    return db
      .updateTable('register_sessions')
      .set({
        signed_out_at: new Date(),
        signed_out_reason: reason,
        signed_out_by_staff_id: endedByStaffId ?? null,
      })
      .where('id', '=', sessionId)
      .where('signed_out_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async forceCloseByDevice(db: Kysely<Database>, deviceId: string) {
    return db
      .updateTable('register_sessions')
      .set({
        signed_out_at: new Date(),
        signed_out_reason: 'FORCED_SIGN_OUT',
      })
      .where('device_id', '=', deviceId)
      .where('signed_out_at', 'is', null)
      .returningAll()
      .execute();
  }

  async findActiveByRegisterNumber(db: Kysely<Database>, registerNumber: RegisterNumber) {
    return db
      .selectFrom('register_sessions')
      .selectAll()
      .where('register_number', '=', registerNumber)
      .where('signed_out_at', 'is', null)
      .executeTakeFirst();
  }

  async findActiveByDeviceId(db: Kysely<Database>, deviceId: string) {
    return db
      .selectFrom('register_sessions')
      .selectAll()
      .where('device_id', '=', deviceId)
      .where('signed_out_at', 'is', null)
      .executeTakeFirst();
  }

  async listActiveByRegisters(db: Kysely<Database>, registerNumbers: RegisterNumber[]) {
    return db
      .selectFrom('register_sessions')
      .selectAll()
      .where('register_number', 'in', registerNumbers)
      .where('signed_out_at', 'is', null)
      .execute();
  }

  async listExpiredForTtl(db: Kysely<Database>, cutoff: Date, limit: number) {
    return db
      .selectFrom('register_sessions')
      .select(['id'])
      .where('signed_out_at', 'is', null)
      .where('last_heartbeat_at', '<', cutoff)
      .orderBy('last_heartbeat_at', 'asc')
      .limit(limit)
      .forUpdate()
      .skipLocked()
      .execute();
  }

  async closeExpiredSessions(db: Kysely<Database>, sessionIds: string[]) {
    if (sessionIds.length === 0) return [];
    return db
      .updateTable('register_sessions')
      .set({
        signed_out_at: new Date(),
        signed_out_reason: 'TTL_EXPIRED',
      })
      .where('id', 'in', sessionIds)
      .where('signed_out_at', 'is', null)
      .returningAll()
      .execute();
  }
}
