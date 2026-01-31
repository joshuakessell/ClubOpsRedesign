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
