import type { InventoryItemType, InventoryStatus } from './inventory.dto';

export type UpdateInventoryStatusRequestDto = {
  toStatus: InventoryStatus;
  note?: string | null;
};

export type CreateInventoryItemRequestDto = {
  type: InventoryItemType;
  name: string;
  status?: InventoryStatus;
  notes?: string | null;
};
