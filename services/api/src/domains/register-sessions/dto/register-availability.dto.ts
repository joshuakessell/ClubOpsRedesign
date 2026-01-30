import type { RegisterNumber } from './register-session.dto';

export type RegisterAvailabilityItemDto = {
  registerNumber: RegisterNumber;
  available: boolean;
  activeSessionId?: string | null;
};

export type RegisterAvailabilityResponseDto = {
  registers: RegisterAvailabilityItemDto[];
};
