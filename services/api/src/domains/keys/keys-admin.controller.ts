import { Body, Controller, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { AdminGuard } from '../auth-staff/guards/admin.guard';
import { KeysService } from './keys.service';
import type { UpdateKeyTagRequestDto } from './dto/key-requests.dto';
import type { KeyTagDto } from './dto/key-tag.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/admin/key-tags')
export class KeysAdminController {
  constructor(private readonly keysService: KeysService) {}

  @Patch(':id')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateKeyTagRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<KeyTagDto> {
    if (!req.staffSession) {
      throwUnauthorized('Staff session context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.keysService.updateKeyTag(id, body, req.staffSession.staffId);
  }
}
