import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from './database.types';
import { KYSELY_PROVIDER } from './database.constants';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(KYSELY_PROVIDER) private readonly db: Kysely<Database>) {}

  get client(): Kysely<Database> {
    return this.db;
  }

  async transaction<T>(fn: (trx: Transaction<Database>) => Promise<T>): Promise<T> {
    return this.db.transaction().execute((trx) => fn(trx));
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}
