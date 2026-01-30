import type { Generated } from 'kysely';

export interface StaffTable {
  id: Generated<string>;
  identifier: string;
  name: string;
  pin_hash: string;
  role: 'staff' | 'admin';
  enabled: boolean;
  created_at: Date;
}

export interface DevicesTable {
  id: Generated<string>;
  name: string;
  kind: 'register' | 'kiosk' | 'office';
  enabled: boolean;
  device_token_hash: string;
  last_seen_at: Date | null;
  created_at: Date;
}

export interface StaffSessionsTable {
  id: Generated<string>;
  staff_id: string;
  device_id: string;
  session_token_hash: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface RegisterSessionsTable {
  id: Generated<string>;
  register_number: 1 | 2 | 3;
  staff_id: string;
  device_id: string;
  started_at: Date;
  last_heartbeat_at: Date;
  signed_out_at: Date | null;
  signed_out_reason: string | null;
  signed_out_by_staff_id: string | null;
}

export interface AuditLogTable {
  id: Generated<string>;
  actor_staff_id: string | null;
  actor_device_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface Database {
  staff: StaffTable;
  devices: DevicesTable;
  staff_sessions: StaffSessionsTable;
  register_sessions: RegisterSessionsTable;
  audit_log: AuditLogTable;
}
