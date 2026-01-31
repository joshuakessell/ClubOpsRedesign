export type VisitStatus = 'ACTIVE' | 'CLOSED';

export type VisitDto = {
  id: string;
  customerId: string;
  status: VisitStatus;
  startedAt: string;
  plannedEndAt: string;
  closedAt: string | null;
  initialDurationMinutes: number;
  maxTotalDurationMinutes: number;
  renewalTotalMinutes: number;
};

export type VisitNullableResponseDto = {
  visit: VisitDto | null;
};

export type VisitAssignmentDto = {
  visitId: string;
  inventoryItemId: string;
  assignedAt: string;
  releasedAt: string | null;
};
