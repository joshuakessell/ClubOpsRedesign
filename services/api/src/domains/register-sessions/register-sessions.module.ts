import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { ConfigModule } from '../../platform/config/config.module';
import { RegisterSessionsRepository } from './register-sessions.repository';
import { RegisterSessionsService } from './register-sessions.service';
import { RegisterSessionsController } from './register-sessions.controller';
import { RegisterSessionsAdminController } from './register-sessions-admin.controller';
import { RegisterSessionsReadService } from './register-sessions.read.service';
import { DevicesModule } from '../devices/devices.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    ConfigModule,
    AuditModule,
    DevicesModule,
  ],
  controllers: [RegisterSessionsController, RegisterSessionsAdminController],
  providers: [RegisterSessionsRepository, RegisterSessionsService, RegisterSessionsReadService],
  exports: [RegisterSessionsService, RegisterSessionsReadService],
})
export class RegisterSessionsModule {}
