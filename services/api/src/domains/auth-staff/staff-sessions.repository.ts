import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class StaffSessionsRepository {
  async createSession(db: Kysely<Database>) {
    void db;
    throw new Error('Not implemented');
  }

  async revokeSession(db: Kysely<Database>, sessionTokenHash: string) {
    void db;
    void sessionTokenHash;
    throw new Error('Not implemented');
  }

  async findSessionByToken(db: Kysely<Database>, sessionTokenHash: string) {
    void db;
    void sessionTokenHash;
    throw new Error('Not implemented');
  }
}
