import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { DevicesRepository } from './devices.repository';
import { DevicesReadService } from './devices.read.service';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { AdminDevicesController } from './admin-devices.controller';
import { RegisterSessionsModule } from '../register-sessions/register-sessions.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => RegisterSessionsModule)],
  controllers: [DevicesController, AdminDevicesController],
  providers: [DevicesRepository, DevicesReadService, DevicesService],
  exports: [DevicesReadService, DevicesService],
})
export class DevicesModule {}
