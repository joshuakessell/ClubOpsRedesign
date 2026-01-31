import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { HoldsOrchestratorService } from '../../application/orchestration/holds-orchestrator.service';
import type { CreateHoldRequestDto } from './dto/hold-requests.dto';
import type { HoldDto } from './dto/hold.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/holds')
export class HoldsController {
  constructor(private readonly holdsOrchestrator: HoldsOrchestratorService) {}

  @Post()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async create(@Body() body: CreateHoldRequestDto, @Req() req: Request & RequestContext): Promise<HoldDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.holdsOrchestrator.create(body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Post(':id/release')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async release(@Param('id') id: string, @Req() req: Request & RequestContext): Promise<HoldDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.holdsOrchestrator.release(id, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }
}
