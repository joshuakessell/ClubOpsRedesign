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

export interface InventoryItemsTable {
  id: Generated<string>;
  type: 'room' | 'locker';
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'OUT_OF_SERVICE';
  notes: string | null;
  updated_at: Date;
  created_at: Date;
}

export interface KeyTagsTable {
  id: Generated<string>;
  tag_code: string;
  assigned_to_item_id: string | null;
  enabled: boolean;
  created_at: Date;
}

export interface CleaningBatchesTable {
  id: Generated<string>;
  created_by_staff_id: string | null;
  created_at: Date;
}

export interface CleaningBatchItemsTable {
  batch_id: string;
  inventory_item_id: string;
  from_status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'OUT_OF_SERVICE';
  to_status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'OUT_OF_SERVICE';
  created_at: Date;
}

export interface CustomersTable {
  id: Generated<string>;
  first_name: string;
  last_name: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: Date;
}

export interface VisitsTable {
  id: Generated<string>;
  customer_id: string;
  status: 'ACTIVE' | 'CLOSED';
  started_at: Date;
  planned_end_at: Date;
  closed_at: Date | null;
  initial_duration_minutes: number;
  max_total_duration_minutes: number;
  renewal_total_minutes: number;
  created_by_staff_id: string | null;
}

export interface VisitRenewalsTable {
  id: Generated<string>;
  visit_id: string;
  duration_minutes: 120 | 360;
  created_by_staff_id: string | null;
  created_at: Date;
}

export interface VisitAssignmentsTable {
  visit_id: string;
  inventory_item_id: string;
  assigned_at: Date;
  released_at: Date | null;
}

export interface AgreementsTable {
  id: Generated<string>;
  visit_id: string;
  status: 'SIGNED' | 'BYPASSED';
  captured_at: Date;
  method: 'KIOSK' | 'REGISTER' | 'ADMIN';
  metadata: Record<string, unknown>;
}

export interface Database {
  staff: StaffTable;
  devices: DevicesTable;
  staff_sessions: StaffSessionsTable;
  register_sessions: RegisterSessionsTable;
  audit_log: AuditLogTable;
  inventory_items: InventoryItemsTable;
  key_tags: KeyTagsTable;
  cleaning_batches: CleaningBatchesTable;
  cleaning_batch_items: CleaningBatchItemsTable;
  customers: CustomersTable;
  visits: VisitsTable;
  visit_renewals: VisitRenewalsTable;
  visit_assignments: VisitAssignmentsTable;
  agreements: AgreementsTable;
}
