# Phase 2 Design Artifacts (Inventory + Cleaning)

This is design-only. No code changes are made here.

## 1) Proposed NestJS modules (Phase 2 only)

- `InventoryModule`
  - Inventory write service (status transitions + invariants)
  - Inventory read service (lists, details)
  - Inventory repository (writes and reads local to domain)

- `KeysModule`
  - Key tag read/write service
  - Key tag scan service (resolves tag_code to item)
  - Key tag repository

- `CleaningModule`
  - Cleaning batch service (batch transitions)
  - Cleaning repository

- `Audit` reuse (existing `AuditService`):
  - All inventory/key/cleaning transitions write audit entries

Optional split (recommended):
- `InventoryReadService` and `InventoryWriteService` to keep aggregation out of write paths.

Notes:
- No cross-domain repository imports.
- Cross-domain reads only via exported read services (e.g., Keys -> InventoryReadService).
- Controllers remain thin; all invariants in services.

## 2) Proposed DB tables/columns (PostgreSQL)

### `inventory_items`
- `id uuid pk`
- `type text` CHECK (`type` IN ('room','locker'))
- `name text` (human readable name or number)
- `status text` CHECK (`status` IN ('AVAILABLE','OCCUPIED','DIRTY','CLEANING','OUT_OF_SERVICE'))
- `notes text null`
- `updated_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

Indexes/constraints:
- `index inventory_items(status)`
- `unique (type, name)` if name/number must be unique per type

### `key_tags`
- `id uuid pk`
- `tag_code text not null unique` (scannable tag)
- `assigned_to_item_id uuid null` FK -> `inventory_items(id)`
- `enabled boolean not null default true`
- `created_at timestamptz not null default now()`

Indexes/constraints:
- `unique (tag_code)`
- `unique (assigned_to_item_id) where assigned_to_item_id is not null` (one key per item at a time)

### `cleaning_batches`
- `id uuid pk`
- `created_by_staff_id uuid fk -> staff(id)`
- `created_at timestamptz not null default now()`

### `cleaning_batch_items`
- `batch_id uuid fk -> cleaning_batches(id)`
- `inventory_item_id uuid fk -> inventory_items(id)`
- `from_status text not null`
- `to_status text not null`
- `created_at timestamptz not null default now()`

Indexes/constraints:
- `primary key (batch_id, inventory_item_id)`
- `index cleaning_batch_items(inventory_item_id)`

### Audit log
- Reuse existing `audit_log` table.
- Write entries for every state transition and key assignment.

## 3) API contract additions (Phase 2 only)

All endpoints are new under `/v1` and must be added to `openapi.yaml` when Phase 2 begins.

### Inventory
- `GET /v1/inventory/items`
  - Query: optional filters `type`, `status`
  - Response: list of `InventoryItemDTO`

- `GET /v1/inventory/items/{id}`
  - Response: `InventoryItemDTO`

- `PATCH /v1/inventory/items/{id}/status`
  - Body: `UpdateInventoryStatusRequest`
  - Response: `InventoryItemDTO`

DTOs:
- `InventoryItemDTO`:
  - `id: string`
  - `type: 'room' | 'locker'`
  - `name: string`
- `status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'OUT_OF_SERVICE'`
  - `notes?: string | null`
  - `updatedAt: string`

- `UpdateInventoryStatusRequest`:
  - `toStatus: ...`
  - `note?: string`
  - Optional: `reason?: 'CLEANING' | 'OUT_OF_SERVICE' | 'MANUAL'` (if needed)

### Keys
- `POST /v1/keys/scan`
  - Body: `KeyScanRequest` (`tagCode: string`)
  - Response: `KeyScanResponse` (key tag + linked item if any)

DTOs:
- `KeyTagDTO`:
  - `id: string`
  - `tagCode: string`
  - `assignedToItemId: string | null`
  - `enabled: boolean`

- `KeyScanResponse`:
  - `keyTag: KeyTagDTO`
  - `item: InventoryItemDTO | null`

### Cleaning
- `POST /v1/cleaning/batch`
  - Body: `CleaningBatchRequest`
  - Response: `CleaningBatchResponse`

DTOs:
- `CleaningBatchRequest`:
  - `itemIds?: string[]`
  - `tagCodes?: string[]`
  - `toStatus: 'CLEANING' | 'AVAILABLE'` (limit to valid transitions)

- `CleaningBatchResponse`:
  - `batchId: string`
  - `results: Array<{ itemId: string; status: 'UPDATED' | 'SKIPPED' | 'FAILED'; message?: string }>`

### Admin (if needed)
- `POST /v1/admin/inventory/items`
  - Body: `CreateInventoryItemRequest`
  - Response: `InventoryItemDTO`

- `PATCH /v1/admin/key-tags/{id}`
  - Body: `UpdateKeyTagRequest` (enable/disable/assign)
  - Response: `KeyTagDTO`

## 4) Transaction boundaries

### Inventory status change
- Must be atomic:
  - Read current status
  - Validate transition
  - Update inventory_items.status + updated_at
  - Write audit_log entry

### Cleaning batch
- **Per-item transactions** (recommended):
  - Each item transition is done in its own transaction to avoid blocking the entire batch.
  - Results include per-item status (UPDATED/SKIPPED/FAILED).
  - Rationale: Scans can be partial; a single bad tag should not fail the whole batch.

### Key tag assignment
- Must be atomic:
  - Validate tag enabled
  - Ensure uniqueness for assigned_to_item_id
  - Update key_tags assignment
  - Write audit_log entry

## 5) Invariants (Phase 2)

- `inventory_items.type` is restricted to room|locker.
- `inventory_items.status` only transitions through allowed paths.
- One key tag assigned to at most one inventory item at a time.
- Key scan must reject disabled tags.
- All state transitions write audit_log entries.

## 6) Error handling (Phase 2)

- Reuse the global error envelope `{ error, message, code? }`.
- Add new error codes only when Phase 2 OpenAPI is updated.
- Use 409 for invalid transitions and conflicts, 404 for missing entities, 403 for disabled tag or forbidden actions.
