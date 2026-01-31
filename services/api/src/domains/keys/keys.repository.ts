import { Injectable } from '@nestjs/common';
import type { Kysely, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class KeysRepository {
  async findByTagCode(db: Kysely<Database>, tagCode: string) {
    return db
      .selectFrom('key_tags')
      .selectAll()
      .where('tag_code', '=', tagCode)
      .executeTakeFirst();
  }

  async findById(db: Kysely<Database>, id: string) {
    return db.selectFrom('key_tags').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByAssignedItemId(db: Kysely<Database>, itemId: string) {
    return db
      .selectFrom('key_tags')
      .selectAll()
      .where('assigned_to_item_id', '=', itemId)
      .executeTakeFirst();
  }

  async update(db: Kysely<Database>, id: string, values: Updateable<Database['key_tags']>) {
    return db.updateTable('key_tags').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }
}
