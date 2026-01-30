import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class DevicesRepository {
  async findById(db: Kysely<Database>, deviceId: string) {
    void db;
    void deviceId;
    throw new Error('Not implemented');
  }

  async findByTokenHash(db: Kysely<Database>, tokenHash: string) {
    void db;
    void tokenHash;
    throw new Error('Not implemented');
  }

  async listAll(db: Kysely<Database>) {
    void db;
    throw new Error('Not implemented');
  }

  async create(db: Kysely<Database>) {
    void db;
    throw new Error('Not implemented');
  }

  async update(db: Kysely<Database>, deviceId: string) {
    void db;
    void deviceId;
    throw new Error('Not implemented');
  }
}
