import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class AssignmentsRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['visit_assignments']>) {
    return db.insertInto('visit_assignments').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async releaseByVisit(db: Kysely<Database>, visitId: string) {
    return db
      .updateTable('visit_assignments')
      .set({ released_at: new Date() })
      .where('visit_id', '=', visitId)
      .where('released_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async findActiveByVisit(
    db: Kysely<Database>,
    visitId: string
  ): Promise<Selectable<Database['visit_assignments']> | undefined> {
    return db
      .selectFrom('visit_assignments')
      .selectAll()
      .where('visit_id', '=', visitId)
      .where('released_at', 'is', null)
      .executeTakeFirst();
  }

  async findActiveByInventoryItem(
    db: Kysely<Database>,
    inventoryItemId: string
  ): Promise<Selectable<Database['visit_assignments']> | undefined> {
    return db
      .selectFrom('visit_assignments')
      .selectAll()
      .where('inventory_item_id', '=', inventoryItemId)
      .where('released_at', 'is', null)
      .executeTakeFirst();
  }
}
