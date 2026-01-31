import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import type { InventoryItemType, InventoryStatus } from './dto/inventory.dto';

@Injectable()
export class InventoryRepository {
  async list(
    db: Kysely<Database>,
    filters: { type?: InventoryItemType; status?: InventoryStatus }
  ): Promise<Selectable<Database['inventory_items']>[]> {
    let query = db.selectFrom('inventory_items').selectAll();
    if (filters.type) {
      query = query.where('type', '=', filters.type);
    }
    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }
    return query.orderBy('type', 'asc').orderBy('name', 'asc').execute();
  }

  async findById(
    db: Kysely<Database>,
    id: string
  ): Promise<Selectable<Database['inventory_items']> | undefined> {
    return db.selectFrom('inventory_items').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByIdForUpdate(
    db: Kysely<Database>,
    id: string
  ): Promise<Selectable<Database['inventory_items']> | undefined> {
    return db
      .selectFrom('inventory_items')
      .selectAll()
      .where('id', '=', id)
      .forUpdate()
      .executeTakeFirst();
  }

  async create(
    db: Kysely<Database>,
    values: Insertable<Database['inventory_items']>
  ): Promise<Selectable<Database['inventory_items']>> {
    return db.insertInto('inventory_items').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async updateStatus(
    db: Kysely<Database>,
    id: string,
    values: Updateable<Database['inventory_items']>
  ): Promise<Selectable<Database['inventory_items']> | undefined> {
    return db.updateTable('inventory_items').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }
}
