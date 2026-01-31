import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { AdminGuard } from '../auth-staff/guards/admin.guard';
import { InventoryService } from './inventory.service';
import type { CreateInventoryItemRequestDto } from './dto/inventory-requests.dto';
import type { InventoryItemDto } from './dto/inventory.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/admin/inventory/items')
export class InventoryAdminController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async create(
    @Body() body: CreateInventoryItemRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<InventoryItemDto> {
    if (!req.staffSession) {
      throwUnauthorized('Staff session context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.inventoryService.createItem(body, req.staffSession.staffId);
  }
}
