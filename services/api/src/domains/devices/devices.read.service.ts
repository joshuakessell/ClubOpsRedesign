import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { DevicesRepository } from './devices.repository';

@Injectable()
export class DevicesReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly devicesRepository: DevicesRepository
  ) {}

  async findById(deviceId: string) {
    const db = this.databaseService.client;
    return this.devicesRepository.findById(db, deviceId);
  }

  async findByTokenHash(tokenHash: string) {
    const db = this.databaseService.client;
    return this.devicesRepository.findByTokenHash(db, tokenHash);
  }

  async listAll() {
    const db = this.databaseService.client;
    return this.devicesRepository.listAll(db);
  }

  async getSelf() {
    throw new Error('Not implemented');
  }
}
