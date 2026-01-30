import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { AdminGuard } from '../auth-staff/guards/admin.guard';
import { DevicesReadService } from './devices.read.service';
import { DevicesService } from './devices.service';
import type { CreateDeviceRequestDto, DeviceDto, ProvisionDeviceResponseDto, UpdateDeviceRequestDto } from './dto/device.dto';

@Controller('v1/admin/devices')
export class AdminDevicesController {
  constructor(
    private readonly devicesReadService: DevicesReadService,
    private readonly devicesService: DevicesService
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
    @Body() body: UpdateDeviceRequestDto
  ): Promise<DeviceDto> {
    return this.devicesService.updateDevice(deviceId, body);
  }
}
