import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { StaffRepository } from './staff.repository';

@Injectable()
export class StaffReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly staffRepository: StaffRepository
  ) {}

  async listForLogin() {
    const db = this.databaseService.client;
    return this.staffRepository.listEnabledStaff(db);
  }

  async findByIdentifier(identifier: string) {
    const db = this.databaseService.client;
    return this.staffRepository.findByIdentifier(db, identifier);
  }

  async findById(staffId: string) {
    const db = this.databaseService.client;
    return this.staffRepository.findById(db, staffId);
  }
}
