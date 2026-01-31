import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely, Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class AgreementsRepository {
  async create(db: Kysely<Database>, values: Insertable<Database['agreements']>) {
    return db.insertInto('agreements').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async findByVisitId(
    db: Kysely<Database>,
    visitId: string
  ): Promise<Selectable<Database['agreements']> | undefined> {
    return db.selectFrom('agreements').selectAll().where('visit_id', '=', visitId).executeTakeFirst();
  }
}
