import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { DOMAIN_EVENTS_PUBLISHER } from '../../platform/events/events.module';
import type { DomainEventsPublisher } from '../../platform/events/domain-events.publisher';
import { StaffReadService } from '../staff/staff.read.service';
import { DevicesReadService } from '../devices/devices.read.service';
import { AuditService } from '../audit/audit.service';
import { RegisterSessionsRepository } from './register-sessions.repository';
import type { RegisterNumber, RegisterSessionDto } from './dto/register-session.dto';
import type { CloseRegisterSessionRequestDto, ForceSignOutRequestDto, OpenRegisterSessionRequestDto } from './dto/register-session-requests.dto';
import type { RegisterAvailabilityResponseDto } from './dto/register-availability.dto';

@Injectable()
export class RegisterSessionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly registerSessionsRepository: RegisterSessionsRepository,
    private readonly staffReadService: StaffReadService,
    private readonly devicesReadService: DevicesReadService,
    private readonly auditService: AuditService,
    @Inject(DOMAIN_EVENTS_PUBLISHER) private readonly eventsPublisher: DomainEventsPublisher
  ) {}

  async getAvailability(): Promise<RegisterAvailabilityResponseDto> {
    void this.databaseService;
    throw new Error('Not implemented');
  }

  async openSession(_request: OpenRegisterSessionRequestDto): Promise<RegisterSessionDto> {
    void this.registerSessionsRepository;
    void this.staffReadService;
    void this.devicesReadService;
    void this.auditService;
    void this.eventsPublisher;
    throw new Error('Not implemented');
  }

  async heartbeat(sessionId: string): Promise<RegisterSessionDto> {
    void sessionId;
    throw new Error('Not implemented');
  }

  async closeSession(sessionId: string, _request: CloseRegisterSessionRequestDto): Promise<RegisterSessionDto> {
    void sessionId;
    throw new Error('Not implemented');
  }

  async forceSignOut(registerNumber: RegisterNumber, _request: ForceSignOutRequestDto): Promise<RegisterSessionDto> {
    void registerNumber;
    throw new Error('Not implemented');
  }

  async forceCloseByDevice(deviceId: string): Promise<void> {
    void deviceId;
    throw new Error('Not implemented');
  }

  async getActiveByRegisterNumber(registerNumber: RegisterNumber) {
    void registerNumber;
    throw new Error('Not implemented');
  }

  async getActiveByDeviceId(deviceId: string) {
    void deviceId;
    throw new Error('Not implemented');
  }

  async listAdminSlots() {
    throw new Error('Not implemented');
  }

  async closeExpiredSessions(): Promise<void> {
    throw new Error('Not implemented');
  }
}
