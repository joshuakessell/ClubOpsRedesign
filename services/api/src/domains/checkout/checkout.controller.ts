import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { CheckoutService } from './checkout.service';
import type { CheckoutRequestDto } from './dto/checkout-requests.dto';
import type { CheckoutEventDto } from './dto/checkout.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':visitId/request')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async request(
    @Param('visitId') visitId: string,
    @Body() body: CheckoutRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<CheckoutEventDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.checkoutService.request(visitId, body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Post(':visitId/complete')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async complete(
    @Param('visitId') visitId: string,
    @Req() req: Request & RequestContext
  ): Promise<CheckoutEventDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.checkoutService.complete(visitId, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }
}
