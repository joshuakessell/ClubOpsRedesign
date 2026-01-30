import { Inject, Injectable } from '@nestjs/common';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from './database.types';
import { KYSELY_PROVIDER } from './database.module';

@Injectable()
export class DatabaseService {
  constructor(@Inject(KYSELY_PROVIDER) private readonly db: Kysely<Database>) {}

  get client(): Kysely<Database> {
    return this.db;
  }

  async transaction<T>(fn: (trx: Transaction<Database>) => Promise<T>): Promise<T> {
    throw new Error('Not implemented');
  }
}
