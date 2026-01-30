import { Injectable } from '@nestjs/common';
import { StaffReadService } from '../staff/staff.read.service';
import { StaffSessionsRepository } from './staff-sessions.repository';
import type { StaffLoginRequestDto, StaffLoginResponseDto, StaffSessionDto } from './dto/login-pin.dto';

@Injectable()
export class AuthStaffService {
  constructor(
    private readonly staffReadService: StaffReadService,
    private readonly staffSessionsRepository: StaffSessionsRepository
  ) {}

  async listStaff(): Promise<{ staff: Array<{ id: string; identifier: string; name: string; role: 'staff' | 'admin' }> }> {
    void this.staffReadService;
    throw new Error('Not implemented');
  }

  async loginWithPin(_body: StaffLoginRequestDto): Promise<StaffLoginResponseDto> {
    void this.staffSessionsRepository;
    throw new Error('Not implemented');
  }

  async logout(): Promise<void> {
    throw new Error('Not implemented');
  }

  async me(): Promise<StaffSessionDto> {
    throw new Error('Not implemented');
  }
}
