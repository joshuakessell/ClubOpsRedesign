export type RegisterSessionUpdatedEvent = {
  sessionId: string;
  registerNumber: 1 | 2 | 3;
  deviceId: string;
  staffId: string;
  status: 'ACTIVE' | 'ENDED';
  endedReason?: 'STAFF_CLOSED' | 'FORCED_SIGN_OUT' | 'TTL_EXPIRED' | null;
  occurredAt: string;
};

export interface DomainEventsPublisher {
  publishRegisterSessionUpdated(event: RegisterSessionUpdatedEvent): Promise<void>;
}
