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
