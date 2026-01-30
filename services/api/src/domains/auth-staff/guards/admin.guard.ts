import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestContext } from '../../../platform/http/request-context';
import { throwForbidden } from '../../../platform/http/errors';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & RequestContext>();
    if (!request.staffSession || request.staffSession.role !== 'admin') {
      throwForbidden('Admin access required', 'FORBIDDEN');
    }
    return true;
  }
}
