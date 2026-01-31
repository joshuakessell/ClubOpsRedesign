import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { UpgradesService } from './upgrades.service';
import type { CreateUpgradeOfferRequestDto } from './dto/upgrade-requests.dto';
import type { UpgradeOfferDto } from './dto/upgrade.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/upgrades')
export class UpgradesController {
  constructor(private readonly upgradesService: UpgradesService) {}

  @Post('offer')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async offer(
    @Body() body: CreateUpgradeOfferRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<UpgradeOfferDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.upgradesService.createOffer(body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Post(':id/accept')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async accept(@Param('id') id: string, @Req() req: Request & RequestContext): Promise<UpgradeOfferDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.upgradesService.accept(id, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Post(':id/decline')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async decline(@Param('id') id: string, @Req() req: Request & RequestContext): Promise<UpgradeOfferDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.upgradesService.decline(id, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }
}
