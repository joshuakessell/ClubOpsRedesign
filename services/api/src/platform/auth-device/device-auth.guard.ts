import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { DeviceAuthService } from './device-auth.service';
import type { RequestContext } from '../http/request-context';
import { throwUnauthorized } from '../http/errors';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly deviceAuthService: DeviceAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & RequestContext>();
    const deviceId = request.headers['x-device-id'];
    const deviceToken = request.headers['x-device-token'];
    if (typeof deviceId !== 'string' || typeof deviceToken !== 'string') {
      throwUnauthorized('Device headers required', 'DEVICE_UNAUTHORIZED');
    }
    const device = await this.deviceAuthService.validateDevice(deviceId, deviceToken);
    const nowIso = new Date().toISOString();
    request.device = {
      id: device.id,
      name: device.name,
      kind: device.kind,
      enabled: device.enabled,
      lastSeenAt: nowIso,
    };
    return true;
  }
}
