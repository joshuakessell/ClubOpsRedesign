# Phase 1 Boundaries

## In scope
- Staff PIN auth (opaque bearer session token)
- Device allowlist + device identity validation
- Register session lifecycle (open, heartbeat, close, TTL)
- Admin force sign-out
- Audit writes and admin audit reads
- Endpoints exactly as defined in `openapi.yaml`

## Out of scope
- Pricing or payment providers
- Inventory state or adjustments
- Visits/check-in flows
- Timeclock/shifts
- Telemetry or analytics pipelines
- WebSocket gateway or realtime subscriptions

## Forbidden change examples
- Adding modules like `pricing`, `payments`, `inventory`, `visits`, `timeclock`, `shifts`, `telemetry`, `websocket`
- Adding endpoints for payment intents, inventory adjustments, or visit check-ins
- Introducing WebSocket gateways or realtime push channels
