import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class DevicesRepository {
  async findById(db: Kysely<Database>, deviceId: string) {
    return db.selectFrom('devices').selectAll().where('id', '=', deviceId).executeTakeFirst();
  }

  async findByTokenHash(db: Kysely<Database>, tokenHash: string) {
    return db
      .selectFrom('devices')
      .selectAll()
      .where('device_token_hash', '=', tokenHash)
      .executeTakeFirst();
  }

  async listAll(db: Kysely<Database>) {
    return db.selectFrom('devices').selectAll().orderBy('created_at', 'desc').execute();
  }

  async create(db: Kysely<Database>, values: Insertable<Database['devices']>) {
    return db
      .insertInto('devices')
      .values({ ...values, created_at: new Date() })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(db: Kysely<Database>, deviceId: string, values: Updateable<Database['devices']>) {
    return db
      .updateTable('devices')
      .set(values)
      .where('id', '=', deviceId)
      .returningAll()
      .executeTakeFirst();
  }

  async touchLastSeen(db: Kysely<Database>, deviceId: string, timestamp: Date) {
    await db
      .updateTable('devices')
      .set({ last_seen_at: timestamp })
      .where('id', '=', deviceId)
      .execute();
  }
}
