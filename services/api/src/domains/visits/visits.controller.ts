import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { VisitsService } from './visits.service';
import { VisitOrchestratorService } from './visit-orchestrator.service';
import type { AssignVisitRequestDto, OpenVisitRequestDto, RenewVisitRequestDto } from './dto/visit-requests.dto';
import type { VisitAssignmentDto, VisitDto, VisitNullableResponseDto } from './dto/visit.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/visits')
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly visitOrchestrator: VisitOrchestratorService
  ) {}

  @Get('active')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async active(@Query('customerId') customerId?: string): Promise<VisitNullableResponseDto> {
    const visit = await this.visitsService.getActiveByCustomerId(customerId ?? '');
    return { visit };
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
    return this.visitsService.open(body, {
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
    return this.visitsService.renew(id, body, {
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
    return this.visitOrchestrator.assignInventory(id, body.inventoryItemId, {
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
    return this.visitOrchestrator.closeVisit(id, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
      role: req.staffSession.role,
    });
  }
}
