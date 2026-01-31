import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { InventoryReadService } from './inventory.read.service';
import { InventoryService } from './inventory.service';
import type { InventoryItemDto, InventoryItemType, InventoryStatus } from './dto/inventory.dto';
import type { InventoryListResponseDto } from './dto/inventory.dto';
import type { UpdateInventoryStatusRequestDto } from './dto/inventory-requests.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwNotFound, throwUnauthorized, throwValidation } from '../../platform/http/errors';

@Controller('v1/inventory')
export class InventoryController {
  constructor(
    private readonly inventoryReadService: InventoryReadService,
    private readonly inventoryService: InventoryService
  ) {}

  @Get('items')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async list(
    @Query('type') type?: string,
    @Query('status') status?: string
  ): Promise<InventoryListResponseDto> {
    const filters: { type?: InventoryItemType; status?: InventoryStatus } = {};
    if (type) {
      if (!['room', 'locker'].includes(type)) {
        throwValidation('type must be room or locker');
      }
      filters.type = type as InventoryItemType;
    }
    if (status) {
      if (!['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE'].includes(status)) {
        throwValidation('status is invalid');
      }
      filters.status = status as InventoryStatus;
    }

    return { items: await this.inventoryReadService.list(filters) };
  }

  @Get('items/:id')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async get(@Param('id') id: string): Promise<InventoryItemDto> {
    const item = await this.inventoryReadService.findDtoById(id);
    if (!item) {
      throwNotFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
    }
    return item;
  }

  @Patch('items/:id/status')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateInventoryStatusRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<InventoryItemDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.inventoryService.updateStatus(id, body, {
      staffId: req.staffSession.staffId,
      deviceId: req.device.id,
      role: req.staffSession.role,
    });
  }
}
