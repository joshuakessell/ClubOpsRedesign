export type AuditLogDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorStaffId: string | null;
  actorDeviceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
