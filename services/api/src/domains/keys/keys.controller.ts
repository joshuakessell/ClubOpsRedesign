import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { KeysService } from './keys.service';
import type { KeyScanRequestDto } from './dto/key-requests.dto';
import type { KeyScanResponseDto } from './dto/key-scan.dto';

@Controller('v1/keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Post('scan')
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  @HttpCode(200)
  async scan(@Body() body: KeyScanRequestDto): Promise<KeyScanResponseDto> {
    return this.keysService.scan(body);
  }
}
