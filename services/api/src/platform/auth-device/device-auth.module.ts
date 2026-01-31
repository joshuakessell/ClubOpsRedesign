import { Global, Module } from '@nestjs/common';
import { DevicesModule } from '../../domains/devices/devices.module';
import { DeviceAuthGuard } from './device-auth.guard';
import { DeviceAuthService } from './device-auth.service';

@Global()
@Module({
  imports: [DevicesModule],
  providers: [DeviceAuthService, DeviceAuthGuard],
  exports: [DeviceAuthService, DeviceAuthGuard],
})
export class DeviceAuthModule {}
