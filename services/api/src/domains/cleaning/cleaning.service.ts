import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import { CleaningRepository } from './cleaning.repository';

@Injectable()
export class CleaningService {
  constructor(private readonly cleaningRepository: CleaningRepository) {}

  async createBatch(
    db: Kysely<Database>,
    values: Insertable<Database['cleaning_batches']>
  ) {
    return this.cleaningRepository.createBatch(db, values);
  }

  async createBatchItem(
    db: Kysely<Database>,
    values: Insertable<Database['cleaning_batch_items']>
  ) {
    return this.cleaningRepository.createBatchItem(db, values);
  }
}
