import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { AuthStaffService } from './auth-staff.service';
import type { StaffLoginRequestDto, StaffLoginResponseDto, StaffSessionDto } from './dto/login-pin.dto';
import type { StaffListItemDto } from '../staff/dto/staff.dto';
import { StaffAuthGuard } from './guards/staff-auth.guard';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

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
  @HttpCode(200)
  async loginPin(
    @Body() body: StaffLoginRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<StaffLoginResponseDto> {
    if (!req.device) {
      throwUnauthorized('Device context missing', 'DEVICE_UNAUTHORIZED');
    }
    return this.authStaffService.loginWithPin(body, req.device.id);
  }

  @Post('logout')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(204)
  async logout(@Req() req: Request & RequestContext): Promise<void> {
    if (!req.staffSession) {
      throwUnauthorized('Staff session context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.authStaffService.logout(req.staffSession.sessionId);
  }

  @Get('me')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async me(@Req() req: Request & RequestContext): Promise<StaffSessionDto> {
    if (!req.staffSession) {
      throwUnauthorized('Staff session context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.authStaffService.me(req.staffSession.sessionId);
  }
}
