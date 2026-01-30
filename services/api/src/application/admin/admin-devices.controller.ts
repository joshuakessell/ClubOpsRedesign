import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { AdminGuard } from '../../domains/auth-staff/guards/admin.guard';
import { StaffAuthGuard } from '../../domains/auth-staff/guards/staff-auth.guard';
import { DevicesReadService } from '../../domains/devices/devices.read.service';
import { DevicesService } from '../../domains/devices/devices.service';
import type { CreateDeviceRequestDto, DeviceDto, ProvisionDeviceResponseDto, UpdateDeviceRequestDto } from '../../domains/devices/dto/device.dto';
import { AdminDeviceOrchestratorService } from './admin-device-orchestrator.service';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized } from '../../platform/http/errors';

@Controller('v1/admin/devices')
export class AdminDevicesController {
  constructor(
    private readonly devicesReadService: DevicesReadService,
    private readonly devicesService: DevicesService,
    private readonly adminDeviceOrchestrator: AdminDeviceOrchestratorService
  ) {}

  @Get()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async list(): Promise<{ devices: DeviceDto[] }> {
    return { devices: await this.devicesReadService.listAll() };
  }

  @Post()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async create(@Body() body: CreateDeviceRequestDto): Promise<ProvisionDeviceResponseDto> {
    return this.devicesService.createDevice(body);
  }

  @Patch(':deviceId')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard, AdminGuard)
  async update(
    @Param('deviceId') deviceId: string,
    @Body() body: UpdateDeviceRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<DeviceDto> {
    if (!req.staffSession || !req.device) {
      throwUnauthorized('Staff session or device context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.adminDeviceOrchestrator.updateDevice(
      deviceId,
      body,
      req.staffSession.staffId,
      req.device.id
    );
  }
}
