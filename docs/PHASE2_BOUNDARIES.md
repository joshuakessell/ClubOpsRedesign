# Phase 2 Boundaries (Inventory + Cleaning)

## In scope
- Inventory items (rooms/lockers) lifecycle
- Key tags and scans
- Cleaning batches and status transitions
- Audit writes for inventory/cleaning changes (reuse AuditService)

## Out of scope (explicit exclusions)
- Pricing or payments
- Visits/check-in flows
- Waitlist
- Timeclock/shifts
- Telemetry/analytics pipelines
- WebSocket gateway / realtime subscriptions

## Forbidden change examples
- Adding modules like `pricing`, `payments`, `visits`, `waitlist`, `timeclock`, `telemetry`, `websocket`
- Adding endpoints for payment intents or visit check-in
- Introducing a WebSocket gateway or event push transport
