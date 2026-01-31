import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable, Updateable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class UpgradesRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['upgrade_offers']>) {
    return db.insertInto('upgrade_offers').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async findById(db: Kysely<Database>, id: string): Promise<Selectable<Database['upgrade_offers']> | undefined> {
    return db.selectFrom('upgrade_offers').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async update(db: Kysely<Database>, id: string, values: Updateable<Database['upgrade_offers']>) {
    return db.updateTable('upgrade_offers').set(values).where('id', '=', id).returningAll().executeTakeFirst();
  }
}
