export type UpgradeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export type UpgradeOfferDto = {
  id: string;
  visitId: string;
  fromInventoryItemId: string;
  toInventoryType: 'room' | 'locker';
  status: UpgradeStatus;
  expiresAt: string;
  createdAt: string;
};
