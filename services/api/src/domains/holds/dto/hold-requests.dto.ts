export type CreateHoldRequestDto = {
  inventoryItemId: string;
  visitId?: string | null;
  waitlistEntryId?: string | null;
  expiresAt: string;
};
