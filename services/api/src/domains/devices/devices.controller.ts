import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import type { DeviceDto } from './dto/device.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/devices')
export class DevicesController {
  @Get('me')
  @UseGuards(DeviceAuthGuard)
  async me(@Req() req: Request & RequestContext): Promise<DeviceDto> {
    if (!req.device) {
      throwUnauthorized('Device context missing', 'DEVICE_UNAUTHORIZED');
    }
    return {
      id: req.device.id,
      name: req.device.name,
      kind: req.device.kind,
      enabled: req.device.enabled,
      lastSeenAt: req.device.lastSeenAt ?? null,
    };
  }
}
