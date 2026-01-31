import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { DevicesRepository } from './devices.repository';
import type { DeviceDto } from './dto/device.dto';

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

  async findDtoById(deviceId: string): Promise<DeviceDto | null> {
    const device = await this.findById(deviceId);
    return device ? this.toDto(device) : null;
  }

  async findByTokenHash(tokenHash: string) {
    const db = this.databaseService.client;
    return this.devicesRepository.findByTokenHash(db, tokenHash);
  }

  async listAll() {
    const db = this.databaseService.client;
    const devices = await this.devicesRepository.listAll(db);
    return devices.map((device) => this.toDto(device));
  }

  async listAllRaw() {
    const db = this.databaseService.client;
    return this.devicesRepository.listAll(db);
  }

  private toDto(device: {
    id: string;
    name: string;
    kind: 'register' | 'kiosk' | 'office';
    enabled: boolean;
    last_seen_at: Date | null;
  }): DeviceDto {
    return {
      id: device.id,
      name: device.name,
      kind: device.kind,
      enabled: device.enabled,
      lastSeenAt: device.last_seen_at ? device.last_seen_at.toISOString() : null,
    };
  }
}
