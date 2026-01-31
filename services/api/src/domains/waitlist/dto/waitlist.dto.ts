export type WaitlistRequestedType = 'room' | 'locker' | 'any';
export type WaitlistStatus = 'OPEN' | 'CANCELLED' | 'FULFILLED';

export type WaitlistEntryDto = {
  id: string;
  customerId: string;
  requestedType: WaitlistRequestedType;
  status: WaitlistStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WaitlistListResponseDto = {
  items: WaitlistEntryDto[];
};
