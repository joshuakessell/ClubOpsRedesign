import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class CleaningRepository {
  async createBatch(db: Kysely<Database>, values: Insertable<Database['cleaning_batches']>) {
    return db.insertInto('cleaning_batches').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async createBatchItem(db: Kysely<Database>, values: Insertable<Database['cleaning_batch_items']>) {
    return db
      .insertInto('cleaning_batch_items')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
