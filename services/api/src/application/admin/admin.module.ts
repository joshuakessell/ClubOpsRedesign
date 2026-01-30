import { Module } from '@nestjs/common';
import { DeviceAuthModule } from '../../platform/auth-device/device-auth.module';
import { AuthStaffModule } from '../../domains/auth-staff/auth-staff.module';
import { DevicesModule } from '../../domains/devices/devices.module';
import { RegisterSessionsModule } from '../../domains/register-sessions/register-sessions.module';
import { AuditModule } from '../../domains/audit/audit.module';
import { AdminDevicesController } from './admin-devices.controller';
import { AdminAuditController } from './admin-audit.controller';
import { AdminDeviceOrchestratorService } from './admin-device-orchestrator.service';

@Module({
  imports: [DeviceAuthModule, AuthStaffModule, DevicesModule, RegisterSessionsModule, AuditModule],
  controllers: [AdminDevicesController, AdminAuditController],
  providers: [AdminDeviceOrchestratorService],
})
export class AdminModule {}
