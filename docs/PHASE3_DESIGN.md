# Phase 3 Design Artifacts (Check-in Core)

Design-only. No code changes here.

## 1) Proposed NestJS modules (Phase 3 only)
- `CustomersModule`
  - Create + lookup customers
  - Customer read service and repository
- `VisitsModule`
  - Open/renew/close visits
  - Visit read service and repository
  - Visit duration policy enforcement
- `AssignmentsModule` (optional if kept inside Visits)
  - Assign inventory items to visits
  - Release assignments on close
- `AgreementsModule`
  - Capture signed/bypassed agreement per visit
- Reuse `AuditService` for all state transitions

Notes:
- No cross-domain repository imports.
- Cross-domain writes must go through owning domain services (or explicit application orchestration).
- Controllers remain thin; services enforce invariants.

## 2) Proposed DB schema additions

### `customers`
- `id uuid pk`
- `first_name text`
- `last_name text`
- `display_name text null`
- `phone text null`
- `email text null`
- `created_at timestamptz not null default now()`

Indexes:
- `index customers (last_name, first_name)`
- Optional unique index on phone or email if desired

### `visits`
- `id uuid pk`
- `customer_id uuid fk -> customers(id)`
- `status text CHECK (status IN ('ACTIVE','CLOSED'))`
- `started_at timestamptz not null default now()`
- `planned_end_at timestamptz not null`
- `closed_at timestamptz null`
- `initial_duration_minutes int not null default 360`
- `max_total_duration_minutes int not null default 840`
- `renewal_total_minutes int not null default 0`
- `created_by_staff_id uuid fk -> staff(id) null`

Indexes/constraints:
- index `(customer_id, status)`
- unique partial index on `(customer_id)` where `status='ACTIVE'` (one active visit per customer)

### `visit_renewals`
- `id uuid pk default gen_random_uuid()`
- `visit_id uuid fk -> visits(id)`
- `duration_minutes int not null CHECK (duration_minutes IN (120, 360))`
- `created_by_staff_id uuid fk -> staff(id) null`
- `created_at timestamptz not null default now()`

Index:
- `(visit_id, created_at)`

### `visit_assignments`
- `visit_id uuid fk -> visits(id)`
- `inventory_item_id uuid fk -> inventory_items(id)`
- `assigned_at timestamptz not null default now()`
- `released_at timestamptz null`

Constraints:
- primary key `(visit_id)`
- unique partial index on `(inventory_item_id)` where `released_at IS NULL` (one active assignment per item)

### `agreements`
- `id uuid pk default gen_random_uuid()`
- `visit_id uuid fk -> visits(id) unique`
- `status text CHECK (status IN ('SIGNED','BYPASSED'))`
- `captured_at timestamptz not null default now()`
- `method text CHECK (method IN ('KIOSK','REGISTER','ADMIN'))`
- `metadata jsonb not null default '{}'::jsonb`

## 3) API contract additions (Phase 3)

All endpoints are new and must be added to `openapi.yaml`.

### Customers
- `GET /v1/customers?query=`
  - Response: list of customers (search by name/phone/email)
- `POST /v1/customers`
  - Body: create customer
  - Response: created customer

### Visits
- `GET /v1/visits/active?customerId=`
  - Response: active visit or null
- `POST /v1/visits/open`
  - Body: customerId, optional staff metadata
  - Response: visit
- `POST /v1/visits/{id}/renew`
  - Body: durationMinutes (120 or 360)
  - Response: visit
- `POST /v1/visits/{id}/assign`
  - Body: inventoryItemId
  - Response: assignment or updated visit
- `POST /v1/visits/{id}/close`
  - Response: visit

### Agreements
- `POST /v1/agreements/{visitId}/capture`
  - Body: status (SIGNED/BYPASSED), method, metadata
  - Response: agreement

## 4) Transaction boundaries
- Open visit:
  - Create visit with `planned_end_at = started_at + 6h`
  - Write audit entry
- Renew visit:
  - Append renewal row
  - Update `planned_end_at`
  - Enforce `planned_end_at <= started_at + 14h`
  - Write audit entry
- Assign inventory:
  - `SELECT ... FOR UPDATE` inventory row
  - Require `inventory.status == AVAILABLE`
  - Update inventory to `OCCUPIED`
  - Create `visit_assignments` row
  - Write audit entries
- Close visit:
  - Set `closed_at`
  - Release assignment
  - Update inventory to `DIRTY`
  - Write audit entries

## 5) OpenAPI lint warnings (documented, not fixed here)
- Warning A: `info-license-strict` expects `license.url`
- Warning B: `operation-4xx-response` expects a 4XX response on `/health`

Preferred handling (Phase 3 docs + tooling):
- Add `.redocly.yaml` to disable the two rules so the spec reflects reality.
