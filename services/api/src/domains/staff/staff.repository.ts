import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class StaffRepository {
  async listEnabledStaff(db: Kysely<Database>) {
    void db;
    throw new Error('Not implemented');
  }

  async findByIdentifier(db: Kysely<Database>, identifier: string) {
    void db;
    void identifier;
    throw new Error('Not implemented');
  }

  async findById(db: Kysely<Database>, staffId: string) {
    void db;
    void staffId;
    throw new Error('Not implemented');
  }
}
