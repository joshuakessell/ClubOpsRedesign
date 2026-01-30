import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { DevicesRepository } from './devices.repository';
import type { CreateDeviceRequestDto, UpdateDeviceRequestDto } from './dto/device.dto';
import { RegisterSessionsService } from '../register-sessions/register-sessions.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly devicesRepository: DevicesRepository,
    @Inject(forwardRef(() => RegisterSessionsService))
    private readonly registerSessionsService: RegisterSessionsService
  ) {}

  async createDevice(_request: CreateDeviceRequestDto) {
    void this.databaseService;
    void this.devicesRepository;
    throw new Error('Not implemented');
  }

  async updateDevice(deviceId: string, _request: UpdateDeviceRequestDto) {
    void deviceId;
    void this.registerSessionsService;
    throw new Error('Not implemented');
  }
}
