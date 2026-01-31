export type InventoryItemType = 'room' | 'locker';

export type InventoryStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'OUT_OF_SERVICE';

export type InventoryItemDto = {
  id: string;
  type: InventoryItemType;
  name: string;
  status: InventoryStatus;
  notes: string | null;
  updatedAt: string;
};

export type InventoryListResponseDto = {
  items: InventoryItemDto[];
};
