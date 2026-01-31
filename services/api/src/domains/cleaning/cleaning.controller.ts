import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { CleaningOrchestratorService } from '../../application/orchestration/cleaning-orchestrator.service';
import type { CleaningBatchRequestDto, CleaningBatchResponseDto } from './dto/cleaning.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/cleaning')
export class CleaningController {
  constructor(private readonly cleaningOrchestrator: CleaningOrchestratorService) {}

  @Post('batch')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async createBatch(
    @Body() body: CleaningBatchRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<CleaningBatchResponseDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.cleaningOrchestrator.createBatch(body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
      role: req.staffSession.role,
    });
  }
}
