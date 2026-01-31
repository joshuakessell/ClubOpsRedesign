-- AUTO-GENERATED FROM MIGRATIONS
-- DO NOT EDIT MANUALLY

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  name text NOT NULL,
  pin_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('staff', 'admin')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('register', 'kiosk', 'office')),
  enabled boolean NOT NULL DEFAULT true,
  device_token_hash text NOT NULL UNIQUE,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id),
  device_id uuid NOT NULL REFERENCES devices(id),
  session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE register_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_number integer NOT NULL CHECK (register_number BETWEEN 1 AND 3),
  staff_id uuid NOT NULL REFERENCES staff(id),
  device_id uuid NOT NULL REFERENCES devices(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  signed_out_at timestamptz,
  signed_out_reason text,
  signed_out_by_staff_id uuid REFERENCES staff(id)
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_staff_id uuid REFERENCES staff(id),
  actor_device_id uuid REFERENCES devices(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX register_sessions_active_register_uq
  ON register_sessions (register_number)
  WHERE signed_out_at IS NULL;

CREATE UNIQUE INDEX register_sessions_active_device_uq
  ON register_sessions (device_id)
  WHERE signed_out_at IS NULL;

CREATE INDEX register_sessions_heartbeat_active_idx
  ON register_sessions (last_heartbeat_at)
  WHERE signed_out_at IS NULL;

CREATE INDEX staff_sessions_token_hash_idx
  ON staff_sessions (session_token_hash);

CREATE INDEX devices_token_hash_idx
  ON devices (device_token_hash);

CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('room', 'locker')),
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE')),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, name)
);

CREATE INDEX inventory_items_status_idx ON inventory_items (status);
CREATE INDEX inventory_items_type_idx ON inventory_items (type);

CREATE TABLE key_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text NOT NULL UNIQUE,
  assigned_to_item_id uuid REFERENCES inventory_items(id),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX key_tags_assigned_item_uq
  ON key_tags (assigned_to_item_id)
  WHERE assigned_to_item_id IS NOT NULL;

CREATE TABLE cleaning_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_staff_id uuid REFERENCES staff(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cleaning_batch_items (
  batch_id uuid NOT NULL REFERENCES cleaning_batches(id),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  from_status text NOT NULL CHECK (from_status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE')),
  to_status text NOT NULL CHECK (to_status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id, inventory_item_id)
);

CREATE INDEX cleaning_batch_items_item_idx ON cleaning_batch_items (inventory_item_id);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  display_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customers_name_idx ON customers (last_name, first_name);

CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  status text NOT NULL CHECK (status IN ('ACTIVE', 'CLOSED')),
  started_at timestamptz NOT NULL DEFAULT now(),
  planned_end_at timestamptz NOT NULL,
  closed_at timestamptz,
  initial_duration_minutes int NOT NULL DEFAULT 360,
  max_total_duration_minutes int NOT NULL DEFAULT 840,
  renewal_total_minutes int NOT NULL DEFAULT 0,
  created_by_staff_id uuid REFERENCES staff(id)
);

CREATE INDEX visits_customer_status_idx ON visits (customer_id, status);

CREATE UNIQUE INDEX visits_active_customer_uq
  ON visits (customer_id)
  WHERE status = 'ACTIVE';

CREATE TABLE visit_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id),
  duration_minutes int NOT NULL CHECK (duration_minutes IN (120, 360)),
  created_by_staff_id uuid REFERENCES staff(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX visit_renewals_visit_idx ON visit_renewals (visit_id, created_at);

CREATE TABLE visit_assignments (
  visit_id uuid NOT NULL REFERENCES visits(id),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  PRIMARY KEY (visit_id)
);

CREATE UNIQUE INDEX visit_assignments_active_item_uq
  ON visit_assignments (inventory_item_id)
  WHERE released_at IS NULL;

CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL UNIQUE REFERENCES visits(id),
  status text NOT NULL CHECK (status IN ('SIGNED', 'BYPASSED')),
  captured_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL CHECK (method IN ('KIOSK', 'REGISTER', 'ADMIN')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  requested_type text NOT NULL CHECK (requested_type IN ('room', 'locker', 'any')),
  status text NOT NULL CHECK (status IN ('OPEN', 'CANCELLED', 'FULFILLED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX waitlist_entries_status_idx ON waitlist_entries (status, created_at);
CREATE INDEX waitlist_entries_customer_idx ON waitlist_entries (customer_id, status);

CREATE TABLE inventory_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  visit_id uuid REFERENCES visits(id),
  waitlist_entry_id uuid REFERENCES waitlist_entries(id),
  status text NOT NULL CHECK (status IN ('ACTIVE', 'RELEASED', 'EXPIRED')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX inventory_holds_active_item_uq
  ON inventory_holds (inventory_item_id)
  WHERE status = 'ACTIVE';

CREATE INDEX inventory_holds_expires_idx ON inventory_holds (expires_at);

CREATE TABLE upgrade_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id),
  from_inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  to_inventory_type text NOT NULL CHECK (to_inventory_type IN ('room', 'locker')),
  status text NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX upgrade_offers_pending_visit_uq
  ON upgrade_offers (visit_id)
  WHERE status = 'PENDING';

CREATE INDEX upgrade_offers_expires_idx ON upgrade_offers (expires_at);

CREATE TABLE checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  method text NOT NULL CHECK (method IN ('KIOSK', 'REGISTER', 'ADMIN'))
);
