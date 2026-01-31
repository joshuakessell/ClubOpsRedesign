# Phase 1 Boundaries (Out of Scope)

Phase 1 is strictly limited to staff PIN auth, device allowlist, register sessions, admin force sign-out, and audit reads/writes.

Do not add any of the following in Phase 1:
- Pricing or payment providers
- Inventory state or adjustments
- Visits/check-in flows
- Timeclock/shifts
- Telemetry or analytics pipelines
- WebSocket gateway or realtime subscriptions

Examples of forbidden additions:
- Creating modules like `pricing`, `payments`, `inventory`, `visits`, `timeclock`, `shifts`, `telemetry`, `websocket`
- Adding endpoints for payment intent creation, inventory adjustments, or visit check-ins
- Introducing WebSocket gateways or realtime push channels
