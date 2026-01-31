import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class VisitsRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['visits']>) {
    return db.insertInto('visits').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async update(db: Kysely<Database>, id: string, values: Updateable<Database['visits']>) {
    return db.updateTable('visits').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }

  async findById(db: Kysely<Database>, id: string): Promise<Selectable<Database['visits']> | undefined> {
    return db.selectFrom('visits').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByIdForUpdate(
    db: Kysely<Database>,
    id: string
  ): Promise<Selectable<Database['visits']> | undefined> {
    return db
      .selectFrom('visits')
      .selectAll()
      .where('id', '=', id)
      .forUpdate()
      .executeTakeFirst();
  }

  async findActiveByCustomerId(
    db: Kysely<Database>,
    customerId: string
  ): Promise<Selectable<Database['visits']> | undefined> {
    return db
      .selectFrom('visits')
      .selectAll()
      .where('customer_id', '=', customerId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
  }
}
