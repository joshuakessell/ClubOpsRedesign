import { Controller, Get, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { DevicesReadService } from './devices.read.service';
import type { DeviceDto } from './dto/device.dto';

@Controller('v1/devices')
export class DevicesController {
  constructor(private readonly devicesReadService: DevicesReadService) {}

  @Get('me')
  @UseGuards(DeviceAuthGuard)
  async me(): Promise<DeviceDto> {
    return this.devicesReadService.getSelf();
  }
}
