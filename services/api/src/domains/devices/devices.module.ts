import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { DevicesRepository } from './devices.repository';
import { DevicesReadService } from './devices.read.service';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [DevicesController],
  providers: [DevicesRepository, DevicesReadService, DevicesService],
  exports: [DevicesReadService, DevicesService],
})
export class DevicesModule {}
