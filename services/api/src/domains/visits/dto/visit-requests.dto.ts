export type OpenVisitRequestDto = {
  customerId: string;
};

export type RenewVisitRequestDto = {
  durationMinutes: 120 | 360;
};

export type AssignVisitRequestDto = {
  inventoryItemId: string;
};
