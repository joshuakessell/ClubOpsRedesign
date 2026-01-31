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

-- Seed snippet (not executed):
-- INSERT INTO inventory_items (type, name, status)
-- VALUES
--   ('room', '1', 'AVAILABLE'), ('room', '2', 'AVAILABLE'), ('room', '3', 'AVAILABLE'), ('room', '4', 'AVAILABLE'),
--   ('room', '5', 'AVAILABLE'), ('room', '6', 'AVAILABLE'), ('room', '7', 'AVAILABLE'), ('room', '8', 'AVAILABLE'),
--   ('room', '9', 'AVAILABLE'), ('room', '10', 'AVAILABLE');
--
-- INSERT INTO inventory_items (type, name, status)
-- VALUES
--   ('locker', '1', 'AVAILABLE'), ('locker', '2', 'AVAILABLE'), ('locker', '3', 'AVAILABLE'), ('locker', '4', 'AVAILABLE'),
--   ('locker', '5', 'AVAILABLE'), ('locker', '6', 'AVAILABLE'), ('locker', '7', 'AVAILABLE'), ('locker', '8', 'AVAILABLE'),
--   ('locker', '9', 'AVAILABLE'), ('locker', '10', 'AVAILABLE'),
--   ('locker', '11', 'AVAILABLE'), ('locker', '12', 'AVAILABLE'), ('locker', '13', 'AVAILABLE'), ('locker', '14', 'AVAILABLE'),
--   ('locker', '15', 'AVAILABLE'), ('locker', '16', 'AVAILABLE'), ('locker', '17', 'AVAILABLE'), ('locker', '18', 'AVAILABLE'),
--   ('locker', '19', 'AVAILABLE'), ('locker', '20', 'AVAILABLE');
--
-- INSERT INTO key_tags (tag_code)
-- VALUES
--   ('TAG-001'), ('TAG-002'), ('TAG-003'), ('TAG-004'), ('TAG-005'), ('TAG-006'), ('TAG-007'), ('TAG-008'), ('TAG-009'), ('TAG-010'),
--   ('TAG-011'), ('TAG-012'), ('TAG-013'), ('TAG-014'), ('TAG-015'), ('TAG-016'), ('TAG-017'), ('TAG-018'), ('TAG-019'), ('TAG-020'),
--   ('TAG-021'), ('TAG-022'), ('TAG-023'), ('TAG-024'), ('TAG-025'), ('TAG-026'), ('TAG-027'), ('TAG-028'), ('TAG-029'), ('TAG-030');
