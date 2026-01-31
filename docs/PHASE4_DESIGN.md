# Phase 4 Design Artifacts (Waitlist + Holds + Upgrades + Checkout)

Design-only. No code changes here.

## 1) Proposed modules
- `WaitlistModule`
  - Create/list/cancel waitlist entries
- `HoldsModule`
  - Create/release inventory holds, TTL handling
- `UpgradesModule`
  - Offer/accept/decline upgrade offers
- `CheckoutModule`
  - Request/complete checkout
- Reuse `AuditService` for every state transition

Notes:
- No cross-domain repository imports.
- Cross-domain writes via explicit service orchestration only.
- Controllers remain thin; services enforce invariants.

## 2) Proposed DB tables

### `waitlist_entries`
- `id uuid pk`
- `customer_id uuid fk -> customers(id)`
- `requested_type text CHECK (requested_type IN ('room','locker','any'))`
- `status text CHECK (status IN ('OPEN','CANCELLED','FULFILLED'))`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `(status, created_at)`
- `(customer_id, status)`

### `inventory_holds`
- `id uuid pk`
- `inventory_item_id uuid fk -> inventory_items(id)`
- `visit_id uuid fk -> visits(id) null`
- `waitlist_entry_id uuid fk -> waitlist_entries(id) null`
- `status text CHECK (status IN ('ACTIVE','RELEASED','EXPIRED'))`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`

Indexes/constraints:
- unique partial index on `(inventory_item_id)` where `status='ACTIVE'`
- index `(expires_at)` for TTL processing

### `upgrade_offers`
- `id uuid pk`
- `visit_id uuid fk -> visits(id)`
- `from_inventory_item_id uuid fk -> inventory_items(id)`
- `to_inventory_type text CHECK (to_inventory_type IN ('room','locker'))`
- `status text CHECK (status IN ('PENDING','ACCEPTED','DECLINED','EXPIRED'))`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`

Indexes/constraints:
- unique partial index on `(visit_id)` where `status='PENDING'`
- index `(expires_at)`

### `checkout_events`
- `id uuid pk`
- `visit_id uuid fk -> visits(id)`
- `requested_at timestamptz not null default now()`
- `completed_at timestamptz null`
- `method text CHECK (method IN ('KIOSK','REGISTER','ADMIN'))`

## 3) API contracts (Phase 4 endpoints)

### Waitlist
- `POST /v1/waitlist`
- `GET /v1/waitlist`
- `POST /v1/waitlist/{id}/cancel`

### Holds
- `POST /v1/holds` (create hold)
- `POST /v1/holds/{id}/release`

### Upgrades
- `POST /v1/upgrades/offer`
- `POST /v1/upgrades/{id}/accept`
- `POST /v1/upgrades/{id}/decline`

### Checkout
- `POST /v1/checkout/{visitId}/request`
- `POST /v1/checkout/{visitId}/complete`

## 4) Transaction boundaries
- Holds:
  - lock inventory row FOR UPDATE
  - ensure no active assignment and no active hold
  - create hold
- Checkout complete:
  - release assignment
  - set inventory to DIRTY
  - close visit
  - audit, all in one transaction
- Upgrade accept:
  - ensure pending offer
  - create hold on target inventory
  - release old assignment
  - assign new inventory
  - audit, all in one transaction

## 5) Error handling (Phase 4)
- New codes: WAITLIST_NOT_FOUND, HOLD_CONFLICT, HOLD_EXPIRED, UPGRADE_NOT_FOUND, UPGRADE_ALREADY_DECIDED, CHECKOUT_ALREADY_COMPLETED
- Use 409 for conflicts, 404 for missing, 400 for validation
