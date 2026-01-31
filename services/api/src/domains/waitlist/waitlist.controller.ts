import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { WaitlistReadService } from './waitlist.read.service';
import { WaitlistService } from './waitlist.service';
import type { CreateWaitlistEntryRequestDto } from './dto/waitlist-requests.dto';
import type { WaitlistEntryDto, WaitlistListResponseDto, WaitlistStatus } from './dto/waitlist.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized, throwValidation } from '../../platform/http/errors';

@Controller('v1/waitlist')
export class WaitlistController {
  constructor(
    private readonly waitlistReadService: WaitlistReadService,
    private readonly waitlistService: WaitlistService
  ) {}

  @Post()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async create(
    @Body() body: CreateWaitlistEntryRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<WaitlistEntryDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.waitlistService.create(body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Get()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async list(@Query('status') status?: string): Promise<WaitlistListResponseDto> {
    if (status && !['OPEN', 'CANCELLED', 'FULFILLED'].includes(status)) {
      throwValidation('status must be OPEN, CANCELLED, or FULFILLED');
    }
    const items = await this.waitlistReadService.list(status as WaitlistStatus | undefined);
    return { items };
  }

  @Post(':id/cancel')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async cancel(
    @Param('id') id: string,
    @Req() req: Request & RequestContext
  ): Promise<WaitlistEntryDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.waitlistService.cancel(id, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }
}
