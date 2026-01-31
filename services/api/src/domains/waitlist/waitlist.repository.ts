import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class WaitlistRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['waitlist_entries']>) {
    return db.insertInto('waitlist_entries').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async list(db: Kysely<Database>, status?: string) {
    let query = db.selectFrom('waitlist_entries').selectAll();
    if (status) {
      query = query.where('status', '=', status as any);
    }
    return query.orderBy('created_at', 'asc').execute();
  }

  async findById(db: Kysely<Database>, id: string): Promise<Selectable<Database['waitlist_entries']> | undefined> {
    return db.selectFrom('waitlist_entries').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async update(db: Kysely<Database>, id: string, values: Updateable<Database['waitlist_entries']>) {
    return db.updateTable('waitlist_entries').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }
}
