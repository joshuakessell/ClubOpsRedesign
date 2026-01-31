export type CleaningTargetStatus = 'CLEANING' | 'AVAILABLE';

export type CleaningBatchRequestDto = {
  itemIds?: string[];
  tagCodes?: string[];
  toStatus: CleaningTargetStatus;
};

export type CleaningBatchResultDto = {
  itemId: string | null;
  tagCode?: string;
  status: 'UPDATED' | 'SKIPPED' | 'FAILED';
  message?: string;
};

export type CleaningBatchResponseDto = {
  batchId: string;
  results: CleaningBatchResultDto[];
};
