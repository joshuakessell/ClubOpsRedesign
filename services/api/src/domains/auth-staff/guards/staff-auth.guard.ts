import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthStaffService } from '../auth-staff.service';

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly authStaffService: AuthStaffService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    void context;
    void this.authStaffService;
    throw new Error('Not implemented');
  }
}
