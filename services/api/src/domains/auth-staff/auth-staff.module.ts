import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { ConfigModule } from '../../platform/config/config.module';
import { StaffModule } from '../staff/staff.module';
import { AuthStaffController } from './auth-staff.controller';
import { AuthStaffService } from './auth-staff.service';
import { StaffSessionsRepository } from './staff-sessions.repository';
import { StaffAuthGuard } from './guards/staff-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [DatabaseModule, StaffModule, ConfigModule],
  controllers: [AuthStaffController],
  providers: [AuthStaffService, StaffSessionsRepository, StaffAuthGuard, AdminGuard],
  exports: [AuthStaffService, StaffAuthGuard, AdminGuard],
})
export class AuthStaffModule {}
