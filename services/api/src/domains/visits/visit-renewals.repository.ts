import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class VisitRenewalsRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['visit_renewals']>) {
    return db.insertInto('visit_renewals').values(values).returningAll().executeTakeFirstOrThrow();
  }
}
