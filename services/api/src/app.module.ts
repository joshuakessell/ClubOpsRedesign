import { Module } from '@nestjs/common';
import { ConfigModule } from './platform/config/config.module';
import { DatabaseModule } from './platform/database/database.module';
import { HttpModule } from './platform/http/http.module';
import { DeviceAuthModule } from './platform/auth-device/device-auth.module';
import { EventsModule } from './platform/events/events.module';
import { JobsModule } from './platform/jobs/jobs.module';
import { StaffModule } from './domains/staff/staff.module';
import { AuthStaffModule } from './domains/auth-staff/auth-staff.module';
import { DevicesModule } from './domains/devices/devices.module';
import { RegisterSessionsModule } from './domains/register-sessions/register-sessions.module';
import { AuditModule } from './domains/audit/audit.module';
import { InventoryModule } from './domains/inventory/inventory.module';
import { KeysModule } from './domains/keys/keys.module';
import { CleaningModule } from './domains/cleaning/cleaning.module';
import { AdminModule } from './application/admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HttpModule,
    DeviceAuthModule,
    EventsModule,
    JobsModule,
    StaffModule,
    AuthStaffModule,
    DevicesModule,
    RegisterSessionsModule,
    AuditModule,
    InventoryModule,
    KeysModule,
    CleaningModule,
    AdminModule,
  ],
})
export class AppModule {}
