import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { RegisterSessionsRepository } from './register-sessions.repository';
import type { RegisterNumber } from './dto/register-session.dto';

@Injectable()
export class RegisterSessionsReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly registerSessionsRepository: RegisterSessionsRepository
  ) {}

  async getActiveByRegisterNumber(registerNumber: RegisterNumber) {
    const db = this.databaseService.client;
    return this.registerSessionsRepository.findActiveByRegisterNumber(db, registerNumber);
  }

  async getActiveByDeviceId(deviceId: string) {
    const db = this.databaseService.client;
    return this.registerSessionsRepository.findActiveByDeviceId(db, deviceId);
  }

  async listActiveByRegisters(registerNumbers: RegisterNumber[]) {
    const db = this.databaseService.client;
    return this.registerSessionsRepository.listActiveByRegisters(db, registerNumbers);
  }
}
