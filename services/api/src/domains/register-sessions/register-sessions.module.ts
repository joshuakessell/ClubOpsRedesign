import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RegisterSessionsRepository } from './register-sessions.repository';
import { RegisterSessionsService } from './register-sessions.service';
import { RegisterSessionsController } from './register-sessions.controller';
import { RegisterSessionsAdminController } from './register-sessions-admin.controller';
import { RegisterSessionsReadService } from './register-sessions.read.service';
import { StaffModule } from '../staff/staff.module';
import { DevicesModule } from '../devices/devices.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    StaffModule,
    AuditModule,
    forwardRef(() => DevicesModule),
  ],
  controllers: [RegisterSessionsController, RegisterSessionsAdminController],
  providers: [RegisterSessionsRepository, RegisterSessionsService, RegisterSessionsReadService],
  exports: [RegisterSessionsService, RegisterSessionsReadService],
})
export class RegisterSessionsModule {}
