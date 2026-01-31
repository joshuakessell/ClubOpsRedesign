import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { AgreementsService } from './agreements.service';
import type { CaptureAgreementRequestDto } from './dto/agreement-requests.dto';
import type { AgreementDto } from './dto/agreement.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Post(':visitId/capture')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async capture(
    @Param('visitId') visitId: string,
    @Body() body: CaptureAgreementRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<AgreementDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.agreementsService.capture(visitId, body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
    });
  }
}
