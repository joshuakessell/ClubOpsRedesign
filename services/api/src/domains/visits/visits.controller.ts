import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { VisitLifecycleService } from '../../application/orchestration/visit-lifecycle.service';
import type { AssignVisitRequestDto, OpenVisitRequestDto, RenewVisitRequestDto } from './dto/visit-requests.dto';
import type { VisitAssignmentDto, VisitDto, VisitNullableResponseDto } from './dto/visit.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized, throwValidation } from '../../platform/http/errors';

@Controller('v1/visits')
export class VisitsController {
  constructor(private readonly visitLifecycle: VisitLifecycleService) {}

  @Get('active')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async active(@Query('customerId') customerId?: string): Promise<VisitNullableResponseDto> {
    if (!customerId || customerId.trim().length === 0) {
      throwValidation('customerId is required');
    }
    return this.visitLifecycle.getActive(customerId.trim());
  }

  @Post('open')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async open(
    @Body() body: OpenVisitRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<VisitDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.visitLifecycle.open(body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Post(':id/renew')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async renew(
    @Param('id') id: string,
    @Body() body: RenewVisitRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<VisitDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.visitLifecycle.renew(id, body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }

  @Post(':id/assign')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async assign(
    @Param('id') id: string,
    @Body() body: AssignVisitRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<VisitAssignmentDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.visitLifecycle.assignInventory(id, body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
      role: req.staffSession.role,
    });
  }

  @Post(':id/close')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async close(
    @Param('id') id: string,
    @Req() req: Request & RequestContext
  ): Promise<VisitDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.visitLifecycle.closeVisit(id, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
      role: req.staffSession.role,
    });
  }
}
