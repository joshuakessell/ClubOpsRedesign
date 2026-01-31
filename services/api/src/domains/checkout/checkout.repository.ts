import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class CheckoutRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['checkout_events']>) {
    return db.insertInto('checkout_events').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async findLatestByVisit(
    db: Kysely<Database>,
    visitId: string
  ): Promise<Selectable<Database['checkout_events']> | undefined> {
    return db
      .selectFrom('checkout_events')
      .selectAll()
      .where('visit_id', '=', visitId)
      .orderBy('requested_at', 'desc')
      .executeTakeFirst();
  }

  async update(db: Kysely<Database>, id: string, values: Updateable<Database['checkout_events']>) {
    return db.updateTable('checkout_events').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }
}
