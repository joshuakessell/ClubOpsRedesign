import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import type { RegisterNumber } from './dto/register-session.dto';

@Injectable()
export class RegisterSessionsRepository {
  async createActiveSession(db: Kysely<Database>) {
    void db;
    throw new Error('Not implemented');
  }

  async updateHeartbeat(db: Kysely<Database>, sessionId: string) {
    void db;
    void sessionId;
    throw new Error('Not implemented');
  }

  async closeSession(db: Kysely<Database>, sessionId: string, endedByStaffId?: string) {
    void db;
    void sessionId;
    void endedByStaffId;
    throw new Error('Not implemented');
  }

  async forceCloseByDevice(db: Kysely<Database>, deviceId: string) {
    void db;
    void deviceId;
    throw new Error('Not implemented');
  }

  async findActiveByRegisterNumber(db: Kysely<Database>, registerNumber: RegisterNumber) {
    void db;
    void registerNumber;
    throw new Error('Not implemented');
  }

  async findActiveByDeviceId(db: Kysely<Database>, deviceId: string) {
    void db;
    void deviceId;
    throw new Error('Not implemented');
  }

  async listActiveByRegisters(db: Kysely<Database>, registerNumbers: RegisterNumber[]) {
    void db;
    void registerNumbers;
    throw new Error('Not implemented');
  }

  async listExpiredForTtl(db: Kysely<Database>) {
    void db;
    throw new Error('Not implemented');
  }

  async closeExpiredSessions(db: Kysely<Database>, sessionIds: string[]) {
    void db;
    void sessionIds;
    throw new Error('Not implemented');
  }
}
