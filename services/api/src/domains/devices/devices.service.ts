import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { DevicesRepository } from './devices.repository';
import type { CreateDeviceRequestDto, UpdateDeviceRequestDto } from './dto/device.dto';
import type { DeviceDto, ProvisionDeviceResponseDto } from './dto/device.dto';
import { hashTokenDeterministic } from '../../platform/security/hash';
import { randomBytes } from 'crypto';
import { throwNotFound, throwValidation } from '../../platform/http/errors';

@Injectable()
export class DevicesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly devicesRepository: DevicesRepository
  ) {}

  async createDevice(request: CreateDeviceRequestDto): Promise<ProvisionDeviceResponseDto> {
    if (!request.name || !request.kind) {
      throwValidation('Device name and kind are required');
    }
    if (!['register', 'kiosk', 'office'].includes(request.kind)) {
      throwValidation('Device kind must be register, kiosk, or office');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashTokenDeterministic(rawToken);
    const enabled = request.enabled ?? true;

    const device = await this.databaseService.transaction((trx) =>
      this.devicesRepository.create(trx, {
        name: request.name,
        kind: request.kind,
        enabled,
        device_token_hash: tokenHash,
        last_seen_at: null,
        created_at: new Date(),
      })
    );

    return { device: this.toDto(device), deviceToken: rawToken };
  }

  async updateDevice(deviceId: string, request: UpdateDeviceRequestDto): Promise<DeviceDto> {
    const db = this.databaseService.client;
    const updateValues: Record<string, unknown> = {};
    if (typeof request.name === 'string') updateValues.name = request.name;
    if (typeof request.kind === 'string') {
      if (!['register', 'kiosk', 'office'].includes(request.kind)) {
        throwValidation('Device kind must be register, kiosk, or office');
      }
      updateValues.kind = request.kind;
    }
    if (typeof request.enabled === 'boolean') updateValues.enabled = request.enabled;

    if (Object.keys(updateValues).length === 0) {
      throwValidation('No fields provided for update');
    }

    const update = await this.devicesRepository.update(db, deviceId, {
      ...updateValues,
    });

    if (!update) {
      throwNotFound('Device not found', 'DEVICE_NOT_FOUND');
    }

    return this.toDto(update);
  }

  async touchLastSeen(deviceId: string): Promise<void> {
    const db = this.databaseService.client;
    await this.devicesRepository.touchLastSeen(db, deviceId, new Date());
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
