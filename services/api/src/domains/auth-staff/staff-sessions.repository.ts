import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class StaffSessionsRepository {
  async createSession(db: Kysely<Database>, values: Insertable<Database['staff_sessions']>) {
    return db
      .insertInto('staff_sessions')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async revokeSession(db: Kysely<Database>, sessionTokenHash: string) {
    await db
      .updateTable('staff_sessions')
      .set({ revoked_at: new Date() })
      .where('session_token_hash', '=', sessionTokenHash)
      .execute();
  }

  async findSessionByToken(db: Kysely<Database>, sessionTokenHash: string) {
    return db
      .selectFrom('staff_sessions')
      .selectAll()
      .where('session_token_hash', '=', sessionTokenHash)
      .executeTakeFirst();
  }
}
