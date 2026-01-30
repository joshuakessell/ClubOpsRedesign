import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DeviceAuthService } from './device-auth.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly deviceAuthService: DeviceAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    void context;
    void this.deviceAuthService;
    throw new Error('Not implemented');
  }
}
