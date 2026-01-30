import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { RegisterSessionsService } from './register-sessions.service';
import type { RegisterAvailabilityResponseDto } from './dto/register-availability.dto';
import type { RegisterNumber, RegisterSessionDto } from './dto/register-session.dto';
import type { CloseRegisterSessionRequestDto, OpenRegisterSessionRequestDto } from './dto/register-session-requests.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized, throwValidation } from '../../platform/http/errors';

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
  async open(
    @Body() body: OpenRegisterSessionRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<RegisterSessionDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.registerSessionsService.openSession(body, req.staffSession.staffId, req.device.id);
  }

  @Post('register-sessions/:id/heartbeat')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async heartbeat(@Param('id') id: string, @Req() req: Request & RequestContext): Promise<RegisterSessionDto> {
    if (!req.device) {
      throwUnauthorized('Device context missing', 'DEVICE_UNAUTHORIZED');
    }
    return this.registerSessionsService.heartbeat(id, req.device.id);
  }

  @Post('register-sessions/:id/close')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async close(
    @Param('id') id: string,
    @Body() body: CloseRegisterSessionRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<RegisterSessionDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.registerSessionsService.closeSession(id, body, req.staffSession.staffId, req.device.id);
  }

  @Get('register-sessions/active')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async active(@Query('registerNumber') registerNumber: string): Promise<{ session: RegisterSessionDto | null }> {
    const parsed = Number(registerNumber);
    if (![1, 2, 3].includes(parsed)) {
      throwValidation('registerNumber must be 1, 2, or 3');
    }
    return { session: await this.registerSessionsService.getActiveByRegisterNumber(parsed as RegisterNumber) };
  }

}
