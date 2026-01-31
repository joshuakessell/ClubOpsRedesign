import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorCode =
  | 'DEVICE_UNAUTHORIZED'
  | 'DEVICE_DISABLED'
  | 'DEVICE_NOT_FOUND'
  | 'STAFF_UNAUTHORIZED'
  | 'STAFF_SESSION_EXPIRED'
  | 'STAFF_DISABLED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'REGISTER_SESSION_NOT_FOUND'
  | 'REGISTER_SESSION_NOT_ACTIVE'
  | 'REGISTER_ACTIVE_CONFLICT'
  | 'DEVICE_ACTIVE_CONFLICT'
  | 'INVENTORY_NOT_FOUND'
  | 'INVALID_STATUS_TRANSITION'
  | 'KEY_TAG_NOT_FOUND'
  | 'KEY_TAG_DISABLED'
  | 'KEY_TAG_ASSIGNMENT_CONFLICT'
  | 'CUSTOMER_NOT_FOUND'
  | 'VISIT_NOT_FOUND'
  | 'VISIT_ALREADY_ACTIVE'
  | 'VISIT_MAX_DURATION_EXCEEDED'
  | 'INVENTORY_UNAVAILABLE_FOR_ASSIGNMENT'
  | 'AGREEMENT_ALREADY_CAPTURED'
  | 'WAITLIST_NOT_FOUND'
  | 'HOLD_NOT_FOUND'
  | 'HOLD_CONFLICT'
  | 'HOLD_EXPIRED'
  | 'UPGRADE_NOT_FOUND'
  | 'UPGRADE_ALREADY_DECIDED'
  | 'CHECKOUT_ALREADY_COMPLETED';

export function errorResponse(error: string, message: string, code?: ErrorCode) {
  return { error, message, code };
}

export function throwHttpError(
  status: number,
  error: string,
  message: string,
  code?: ErrorCode
): never {
  throw new HttpException(errorResponse(error, message, code), status);
}

export function throwUnauthorized(message: string, code: ErrorCode): never {
  throwHttpError(HttpStatus.UNAUTHORIZED, 'Unauthorized', message, code);
}

export function throwForbidden(message: string, code: ErrorCode): never {
  throwHttpError(HttpStatus.FORBIDDEN, 'Forbidden', message, code);
}

export function throwValidation(message: string): never {
  throwHttpError(HttpStatus.BAD_REQUEST, 'Bad Request', message, 'VALIDATION_ERROR');
}

export function throwNotFound(message: string, code: ErrorCode): never {
  throwHttpError(HttpStatus.NOT_FOUND, 'Not Found', message, code);
}

export function throwConflict(message: string, code: ErrorCode): never {
  throwHttpError(HttpStatus.CONFLICT, 'Conflict', message, code);
}

export function throwRateLimited(message: string): never {
  throwHttpError(HttpStatus.TOO_MANY_REQUESTS, 'Too Many Requests', message, 'RATE_LIMITED');
}
