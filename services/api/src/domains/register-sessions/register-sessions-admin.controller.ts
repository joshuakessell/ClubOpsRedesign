import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { AdminGuard } from '../auth-staff/guards/admin.guard';
import { RegisterSessionsService } from './register-sessions.service';
import type { RegisterSessionDto, RegisterSessionSlotDto, RegisterNumber } from './dto/register-session.dto';
import type { ForceSignOutRequestDto } from './dto/register-session-requests.dto';

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
  async forceSignOut(
    @Param('registerNumber') registerNumber: RegisterNumber,
    @Body() body: ForceSignOutRequestDto
  ): Promise<RegisterSessionDto> {
    return this.registerSessionsService.forceSignOut(registerNumber, body);
  }
}
