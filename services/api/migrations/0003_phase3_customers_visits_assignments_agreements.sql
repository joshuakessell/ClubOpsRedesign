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
