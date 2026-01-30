import { Injectable } from '@nestjs/common';
import { AuditService } from '../../domains/audit/audit.service';
import { DevicesService } from '../../domains/devices/devices.service';
import type { UpdateDeviceRequestDto } from '../../domains/devices/dto/device.dto';
import { RegisterSessionsService } from '../../domains/register-sessions/register-sessions.service';

@Injectable()
export class AdminDeviceOrchestratorService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly registerSessionsService: RegisterSessionsService,
    private readonly auditService: AuditService
  ) {}

  async updateDevice(
    deviceId: string,
    request: UpdateDeviceRequestDto,
    actorStaffId: string,
    actorDeviceId: string
  ) {
    const device = await this.devicesService.updateDevice(deviceId, request);

    if (request.enabled === false) {
      await this.registerSessionsService.forceCloseByDevice(deviceId);
      await this.auditService.write({
        action: 'DEVICE_DISABLED',
        entityType: 'device',
        entityId: deviceId,
        actorStaffId,
        actorDeviceId,
        metadata: { reason: 'ADMIN_DISABLED' },
      });
    }

    return device;
  }
}
