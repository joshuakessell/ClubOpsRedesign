import type { RegisterNumber } from './register-session.dto';

export type OpenRegisterSessionRequestDto = {
  registerNumber: RegisterNumber;
};

export type CloseRegisterSessionRequestDto = {
  reason: 'STAFF_SIGN_OUT' | 'SHIFT_END' | 'OTHER';
  note?: string;
};

export type ForceSignOutRequestDto = {
  reason: 'SECURITY' | 'DEVICE_LOST' | 'POLICY' | 'OTHER';
  note?: string;
};
