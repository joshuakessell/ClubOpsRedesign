import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { AdminGuard } from '../../domains/auth-staff/guards/admin.guard';
import { StaffAuthGuard } from '../../domains/auth-staff/guards/staff-auth.guard';
import { AuditReadService } from '../../domains/audit/audit-read.service';
import type { AuditReadQueryInput } from '../../domains/audit/audit-read.service';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/admin/audit')
export class AdminAuditController {
  constructor(private readonly auditReadService: AuditReadService) {}

  @Get()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async list(@Query() query: AuditReadQueryInput, @Req() req: Request & RequestContext) {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.auditReadService.listAudit(query);
  }
}
