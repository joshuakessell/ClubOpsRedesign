export type KeyScanRequestDto = {
  tagCode: string;
};

export type UpdateKeyTagRequestDto = {
  enabled?: boolean;
  assignedToItemId?: string | null;
};
