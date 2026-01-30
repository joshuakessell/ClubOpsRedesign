import { Injectable } from '@nestjs/common';
import { DevicesReadService } from '../../domains/devices/devices.read.service';

@Injectable()
export class DeviceAuthService {
  constructor(private readonly devicesReadService: DevicesReadService) {}

  async validateDevice(deviceId: string, deviceToken: string): Promise<void> {
    void this.devicesReadService;
    void deviceId;
    void deviceToken;
    throw new Error('Not implemented');
  }
}
