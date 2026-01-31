# Phase 2 Definition of Done (Inventory + Keys + Cleaning)

All items must be true before Phase 2 is complete.

## Build + checks
- ✅ API boots with DB connected and Phase 2 migration applied
- ✅ pnpm openapi:lint passes
- ✅ pnpm api:typecheck passes
- ✅ pnpm api:test passes
- ✅ pnpm spec:check passes

## Migrations + schema
- ✅ Phase 2 migration `services/api/migrations/0002_phase2_inventory_keys_cleaning.sql` applied
- ✅ inventory_items has CHECK constraints for type/status
- ✅ key_tags.tag_code is unique
- ✅ key_tags assigned_to_item_id is unique when present
- ✅ cleaning batch tables exist and are linked by FK

## Inventory
- ✅ GET /v1/inventory/items returns filtered list by type/status
- ✅ GET /v1/inventory/items/{id} returns item or 404
- ✅ PATCH /v1/inventory/items/{id}/status enforces transitions
- ✅ OUT_OF_SERVICE requires note
- ✅ Every status change writes audit_log

## Keys
- ✅ POST /v1/keys/scan resolves tag_code to key tag + item
- ✅ Disabled tags are rejected
- ✅ PATCH /v1/admin/key-tags/{id} updates enablement/assignment
- ✅ Assignments enforce one tag per item
- ✅ Key tag updates write audit_log

## Cleaning
- ✅ POST /v1/cleaning/batch transitions DIRTY -> CLEANING and CLEANING -> AVAILABLE
- ✅ Batch writes cleaning_batches + cleaning_batch_items
- ✅ Each item transition writes audit_log
- ✅ Batch handles per-item failures without corrupting data

## Contracts
- ✅ OpenAPI matches controllers for paths, methods, and status codes
- ✅ ErrorResponse.code enum includes all codes thrown
