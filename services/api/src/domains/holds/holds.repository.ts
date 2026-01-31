import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class HoldsRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['inventory_holds']>) {
    return db.insertInto('inventory_holds').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async findById(db: Kysely<Database>, id: string): Promise<Selectable<Database['inventory_holds']> | undefined> {
    return db.selectFrom('inventory_holds').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findActiveByInventoryItem(
    db: Kysely<Database>,
    inventoryItemId: string
  ): Promise<Selectable<Database['inventory_holds']> | undefined> {
    return db
      .selectFrom('inventory_holds')
      .selectAll()
      .where('inventory_item_id', '=', inventoryItemId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
  }

  async findActiveByInventoryItemForUpdate(
    db: Kysely<Database>,
    inventoryItemId: string
  ): Promise<Selectable<Database['inventory_holds']> | undefined> {
    return db
      .selectFrom('inventory_holds')
      .selectAll()
      .where('inventory_item_id', '=', inventoryItemId)
      .where('status', '=', 'ACTIVE')
      .forUpdate()
      .executeTakeFirst();
  }

  async update(db: Kysely<Database>, id: string, values: Updateable<Database['inventory_holds']>) {
    return db.updateTable('inventory_holds').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }
}
