import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';

@Injectable()
export class CleaningReadService {
  constructor(private readonly databaseService: DatabaseService) {}

  get client() {
    return this.databaseService.client;
  }
}
