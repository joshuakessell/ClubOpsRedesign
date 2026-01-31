# Phase 4 Boundaries (Waitlist + Holds + Upgrades + Checkout)

## In scope
- Waitlist entries (room/locker/any) with lifecycle and admin controls
- Inventory holds (timeboxed reservations) to prevent double assignment
- Upgrades (offer/accept/decline) that move a visit to a different inventory item/type
- Checkout request + completion
- Audit writes for every state transition

## Out of scope (explicit exclusions)
- Pricing, payments, orders, cash drawers
- Timeclock/shifts
- Telemetry
- WebSocket gateway

## Notes
- Phase 1–3 remain unchanged and passing.
- OpenAPI remains authoritative; Phase 4 endpoints must be explicitly added.
