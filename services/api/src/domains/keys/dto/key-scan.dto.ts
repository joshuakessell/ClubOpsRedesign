import type { InventoryItemDto } from '../../inventory/dto/inventory.dto';
import type { KeyTagDto } from './key-tag.dto';

export type KeyScanResponseDto = {
  keyTag: KeyTagDto;
  item: InventoryItemDto | null;
};
