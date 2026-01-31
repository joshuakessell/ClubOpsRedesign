# Database Entity Details

## staff
- Purpose: staff identities and roles for authentication.
- Invariants: `identifier` unique; `role` in {staff, admin}; `enabled` gates access.
- Relationships: referenced by staff_sessions, register_sessions, visits, visit_renewals, audit_log.
- Domain owner: staff/auth-staff.

## devices
- Purpose: allowlisted devices for kiosk/register/office.
- Invariants: `device_token_hash` unique; `kind` in {register,kiosk,office}; `enabled` gates access.
- Relationships: referenced by staff_sessions, register_sessions, audit_log.
- Domain owner: devices.

## staff_sessions
- Purpose: opaque staff sessions (hashed tokens).
- Invariants: `session_token_hash` unique; `expires_at` required; revoked sessions invalid.
- Relationships: references staff, devices.
- Domain owner: auth-staff.

## register_sessions
- Purpose: register session lifecycle (open/heartbeat/close).
- Invariants: one active per register and per device (partial uniques); register_number 1–3 only.
- Relationships: references staff, devices.
- Domain owner: register-sessions.

## inventory_items
- Purpose: rooms/lockers with operational status.
- Invariants: `type` in {room, locker}; `status` in {AVAILABLE,OCCUPIED,DIRTY,CLEANING,OUT_OF_SERVICE}; (type, name) unique.
- Relationships: referenced by key_tags, visit_assignments, inventory_holds, upgrade_offers, cleaning_batch_items.
- Domain owner: inventory.

## key_tags
- Purpose: physical key tags with optional assignment to inventory items.
- Invariants: `tag_code` unique; only one tag assigned per inventory item (partial unique).
- Relationships: references inventory_items.
- Domain owner: keys.

## cleaning_batches
- Purpose: batch records for cleaning transitions.
- Invariants: batch identity + timestamp only.
- Relationships: references staff (creator).
- Domain owner: cleaning.

## cleaning_batch_items
- Purpose: per-item status transitions within a batch.
- Invariants: PK (batch_id, inventory_item_id); statuses in inventory enum set.
- Relationships: references cleaning_batches and inventory_items.
- Domain owner: cleaning.

## customers
- Purpose: customer identities for visits and waitlist.
- Invariants: basic name fields required.
- Relationships: referenced by visits and waitlist_entries.
- Domain owner: customers.

## visits
- Purpose: active/closed visit records with planned end time.
- Invariants: one ACTIVE visit per customer; planned_end_at must not exceed started_at + 14h (enforced in service layer).
- Relationships: references customers; referenced by visit_renewals, visit_assignments, agreements, upgrade_offers, checkout_events, inventory_holds.
- Domain owner: visits.

## visit_renewals
- Purpose: renewal history for visits.
- Invariants: duration_minutes in {120, 360}.
- Relationships: references visits, staff.
- Domain owner: visits.

## visit_assignments
- Purpose: assignment of inventory item to a visit.
- Invariants: one active assignment per inventory item (partial unique on released_at IS NULL); PK is visit_id.
- Relationships: references visits and inventory_items.
- Domain owner: assignments.

## agreements
- Purpose: signed/bypassed agreements per visit.
- Invariants: one agreement per visit; status in {SIGNED,BYPASSED}.
- Relationships: references visits.
- Domain owner: agreements.

## waitlist_entries
- Purpose: customer waitlist with requested type.
- Invariants: status in {OPEN,CANCELLED,FULFILLED}; requested_type in {room, locker, any}.
- Relationships: references customers; referenced by inventory_holds.
- Domain owner: waitlist.

## inventory_holds
- Purpose: timeboxed holds on inventory items.
- Invariants: one ACTIVE hold per inventory item (partial unique); status in {ACTIVE, RELEASED, EXPIRED}.
- Relationships: references inventory_items; optional references to visits or waitlist_entries.
- Domain owner: holds.

## upgrade_offers
- Purpose: upgrade offers for a visit.
- Invariants: one PENDING offer per visit (partial unique); status in {PENDING, ACCEPTED, DECLINED, EXPIRED}.
- Relationships: references visits and inventory_items.
- Domain owner: upgrades.

## checkout_events
- Purpose: checkout lifecycle (requested/completed).
- Invariants: method in {KIOSK, REGISTER, ADMIN}.
- Relationships: references visits.
- Domain owner: checkout.

## audit_log
- Purpose: append-only audit trail for state transitions.
- Invariants: immutable rows with actor + entity metadata.
- Relationships: references staff and devices when available.
- Domain owner: audit.
