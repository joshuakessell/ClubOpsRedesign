import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthStaffService } from '../auth-staff.service';
import type { RequestContext } from '../../../platform/http/request-context';
import { throwForbidden, throwUnauthorized } from '../../../platform/http/errors';

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly authStaffService: AuthStaffService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & RequestContext>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throwUnauthorized('Authorization header required', 'STAFF_UNAUTHORIZED');
    }
    const token = authHeader.slice('Bearer '.length).trim();
    const session = await this.authStaffService.resolveSession(token);
    if (request.device && session.deviceId !== request.device.id) {
      throwForbidden('Session device mismatch', 'FORBIDDEN');
    }
    request.staffSession = session;
    return true;
  }
}
