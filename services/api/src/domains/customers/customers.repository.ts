import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class CustomersRepository {
  async search(db: Kysely<Database>, query: string, limit: number): Promise<Selectable<Database['customers']>[]> {
    const like = `%${query}%`;
    return db
      .selectFrom('customers')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('first_name', 'ilike', like),
          eb('last_name', 'ilike', like),
          eb('display_name', 'ilike', like),
          eb('phone', 'ilike', like),
          eb('email', 'ilike', like),
        ])
      )
      .orderBy('last_name', 'asc')
      .orderBy('first_name', 'asc')
      .limit(limit)
      .execute();
  }

  async create(db: Kysely<Database>, values: Insertable<Database['customers']>) {
    return db.insertInto('customers').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async findById(db: Kysely<Database>, id: string): Promise<Selectable<Database['customers']> | undefined> {
    return db.selectFrom('customers').selectAll().where('id', '=', id).executeTakeFirst();
  }
}
