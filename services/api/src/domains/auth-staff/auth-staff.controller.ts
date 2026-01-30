import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { AuthStaffService } from './auth-staff.service';
import type { StaffLoginRequestDto, StaffLoginResponseDto, StaffSessionDto } from './dto/login-pin.dto';
import type { StaffListItemDto } from '../staff/dto/staff.dto';
import { StaffAuthGuard } from './guards/staff-auth.guard';

@Controller('v1/auth')
export class AuthStaffController {
  constructor(private readonly authStaffService: AuthStaffService) {}

  @Get('staff')
  @UseGuards(DeviceAuthGuard)
  async listStaff(): Promise<{ staff: StaffListItemDto[] }> {
    return this.authStaffService.listStaff();
  }

  @Post('login-pin')
  @UseGuards(DeviceAuthGuard)
  async loginPin(@Body() body: StaffLoginRequestDto): Promise<StaffLoginResponseDto> {
    return this.authStaffService.loginWithPin(body);
  }

  @Post('logout')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async logout(): Promise<void> {
    return this.authStaffService.logout();
  }

  @Get('me')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async me(): Promise<StaffSessionDto> {
    return this.authStaffService.me();
  }
}
