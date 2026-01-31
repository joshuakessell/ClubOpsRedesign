export type CreateUpgradeOfferRequestDto = {
  visitId: string;
  fromInventoryItemId: string;
  toInventoryType: 'room' | 'locker';
  expiresAt: string;
};
