import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { RegisterSessionsService } from './register-sessions.service';
import type { RegisterAvailabilityResponseDto } from './dto/register-availability.dto';
import type { RegisterNumber, RegisterSessionDto } from './dto/register-session.dto';
import type { CloseRegisterSessionRequestDto, OpenRegisterSessionRequestDto } from './dto/register-session-requests.dto';

@Controller('v1')
export class RegisterSessionsController {
  constructor(private readonly registerSessionsService: RegisterSessionsService) {}

  @Get('registers/availability')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async availability(): Promise<RegisterAvailabilityResponseDto> {
    return this.registerSessionsService.getAvailability();
  }

  @Post('register-sessions/open')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async open(@Body() body: OpenRegisterSessionRequestDto): Promise<RegisterSessionDto> {
    return this.registerSessionsService.openSession(body);
  }

  @Post('register-sessions/:id/heartbeat')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async heartbeat(@Param('id') id: string): Promise<RegisterSessionDto> {
    return this.registerSessionsService.heartbeat(id);
  }

  @Post('register-sessions/:id/close')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async close(
    @Param('id') id: string,
    @Body() body: CloseRegisterSessionRequestDto
  ): Promise<RegisterSessionDto> {
    return this.registerSessionsService.closeSession(id, body);
  }

  @Get('register-sessions/active')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async active(@Query('registerNumber') registerNumber: RegisterNumber): Promise<{ session: RegisterSessionDto | null }> {
    return { session: await this.registerSessionsService.getActiveByRegisterNumber(registerNumber) };
  }

  @Get('register-sessions/status')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async status(@Query('deviceId') deviceId: string): Promise<{ deviceId: string; session: RegisterSessionDto | null }> {
    return { deviceId, session: await this.registerSessionsService.getActiveByDeviceId(deviceId) };
  }
}
