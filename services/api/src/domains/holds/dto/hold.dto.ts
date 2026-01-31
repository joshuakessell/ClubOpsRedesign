export type HoldStatus = 'ACTIVE' | 'RELEASED' | 'EXPIRED';

export type HoldDto = {
  id: string;
  inventoryItemId: string;
  visitId: string | null;
  waitlistEntryId: string | null;
  status: HoldStatus;
  expiresAt: string;
  createdAt: string;
};
