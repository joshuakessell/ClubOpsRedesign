# System Specification

ClubOpsRedesign is a monorepo for club operations with a NestJS API and three Next.js frontends. The API is the system of record for staff/device access, register sessions, inventory and cleaning, customer visits and agreements, and Phase 4 waitlist/hold/upgrade/checkout flows.

Phases:
- Phase 1: staff PIN auth, device allowlist, register sessions, audit log.
- Phase 2: inventory items, key tags, cleaning batches.
- Phase 3: customers, visits/renewals/assignments, agreements.
- Phase 4: waitlist entries, inventory holds, upgrade offers, checkout events.

Source of truth:
- `openapi.yaml` is the HTTP contract source of truth.
- `services/api/migrations/` plus `db/schema.sql` are the database source of truth.

Explicit invariants:
- One active visit per customer.
- Visit duration: 6h initial, renewals of 2h or 6h, max 14h total.
- One active register session per device.
- One active assignment per inventory item.

Non-goals:
- Pricing, payments, orders, cash drawers.
- Telemetry, timeclock/shifts.
- WebSocket gateway (until explicitly required).
