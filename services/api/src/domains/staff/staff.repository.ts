import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class StaffRepository {
  async listEnabledStaff(db: Kysely<Database>) {
    return db
      .selectFrom('staff')
      .select(['id', 'identifier', 'name', 'role'])
      .where('enabled', '=', true)
      .orderBy('name', 'asc')
      .execute();
  }

  async findByIdentifier(db: Kysely<Database>, identifier: string) {
    return db
      .selectFrom('staff')
      .selectAll()
      .where('identifier', '=', identifier)
      .executeTakeFirst();
  }

  async findById(db: Kysely<Database>, staffId: string) {
    return db.selectFrom('staff').selectAll().where('id', '=', staffId).executeTakeFirst();
  }
}
