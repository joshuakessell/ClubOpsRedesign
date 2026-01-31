# Phase 3 Boundaries (Check-in Core)

## In scope
- Customers (basic identity + lookup)
- Visits (open/close, planned end time, renewals)
- Assignments (assign inventory item to a visit; release on close)
- Agreements (record signed/bypassed, minimal metadata)
- Audit writes for every state transition

## Explicit visit duration policy
- Initial check-in duration is **always 6 hours**
- Renewals may be **2 hours** or **6 hours** only
- Max stay is **14 hours total** from visit start
- `planned_end_at` must never exceed `started_at + 14 hours`
- Renewal is rejected if it would exceed max stay

## Out of scope (explicit exclusions)
- Pricing, payments, orders, cash drawers
- Waitlist, upgrades
- Timeclock/shifts
- Telemetry
- WebSocket gateway (DomainEventsPublisher stays Noop)

## Notes
- Phase 1 and Phase 2 remain unchanged and passing.
- OpenAPI remains authoritative; Phase 3 endpoints must be explicitly added.
