import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { DevicesReadService } from './devices.read.service';
import type { DeviceDto } from './dto/device.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/devices')
export class DevicesController {
  constructor(private readonly devicesReadService: DevicesReadService) {}

  @Get('me')
  @UseGuards(DeviceAuthGuard)
  async me(@Req() req: Request & RequestContext): Promise<DeviceDto> {
    if (!req.device) {
      throwUnauthorized('Device context missing', 'DEVICE_UNAUTHORIZED');
    }
    const device = await this.devicesReadService.findDtoById(req.device.id);
    if (!device) {
      throwUnauthorized('Device not found', 'DEVICE_UNAUTHORIZED');
    }
    return device;
  }
}
