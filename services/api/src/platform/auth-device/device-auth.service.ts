import { Injectable } from '@nestjs/common';
import { DevicesReadService } from '../../domains/devices/devices.read.service';
import { DevicesService } from '../../domains/devices/devices.service';
import { hashTokenDeterministic } from '../security/hash';
import { throwForbidden, throwUnauthorized } from '../http/errors';

@Injectable()
export class DeviceAuthService {
  constructor(
    private readonly devicesReadService: DevicesReadService,
    private readonly devicesService: DevicesService
  ) {}

  async validateDevice(deviceId: string, deviceToken: string) {
    const device = await this.devicesReadService.findById(deviceId);
    if (!device) {
      throwUnauthorized('Unknown device', 'DEVICE_UNAUTHORIZED');
    }

    const tokenHash = hashTokenDeterministic(deviceToken);
    if (device.device_token_hash !== tokenHash) {
      throwUnauthorized('Invalid device token', 'DEVICE_UNAUTHORIZED');
    }

    if (!device.enabled) {
      throwForbidden('Device disabled', 'DEVICE_DISABLED');
    }

    await this.devicesService.touchLastSeen(deviceId);

    return device;
  }
}
