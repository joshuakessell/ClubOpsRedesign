export type RegisterNumber = 1 | 2 | 3;

export type RegisterSessionDto = {
  id: string;
  registerNumber: RegisterNumber;
  staffId: string;
  deviceId: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  lastHeartbeatAt: string;
  endedAt?: string | null;
  endedReason?: 'STAFF_CLOSED' | 'FORCED_SIGN_OUT' | 'TTL_EXPIRED' | null;
};

export type RegisterSessionSlotDto = {
  registerNumber: RegisterNumber;
  session: RegisterSessionDto | null;
};
