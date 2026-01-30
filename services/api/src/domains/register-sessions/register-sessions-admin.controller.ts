import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { AdminGuard } from '../auth-staff/guards/admin.guard';
import { RegisterSessionsService } from './register-sessions.service';
import type { RegisterSessionDto, RegisterSessionSlotDto, RegisterNumber } from './dto/register-session.dto';
import type { ForceSignOutRequestDto } from './dto/register-session-requests.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized, throwValidation } from '../../platform/http/errors';

@Controller('v1/admin/register-sessions')
export class RegisterSessionsAdminController {
  constructor(private readonly registerSessionsService: RegisterSessionsService) {}

  @Get()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async list(): Promise<{ registers: RegisterSessionSlotDto[] }> {
    return { registers: await this.registerSessionsService.listAdminSlots() };
  }

  @Post(':registerNumber/force-signout')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  @HttpCode(200)
  async forceSignOut(
    @Param('registerNumber') registerNumber: string,
    @Body() body: ForceSignOutRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<RegisterSessionDto> {
    if (!req.staffSession) {
      throwUnauthorized('Staff session context missing', 'STAFF_UNAUTHORIZED');
    }
    const parsed = Number(registerNumber);
    if (![1, 2, 3].includes(parsed)) {
      throwValidation('registerNumber must be 1, 2, or 3');
    }
    return this.registerSessionsService.forceSignOut(
      parsed as RegisterNumber,
      body,
      req.staffSession.staffId
    );
  }
}
