import type { WaitlistRequestedType } from './waitlist.dto';

export type CreateWaitlistEntryRequestDto = {
  customerId: string;
  requestedType: WaitlistRequestedType;
  notes?: string | null;
};
