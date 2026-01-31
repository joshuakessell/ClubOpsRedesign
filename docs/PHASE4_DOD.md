# Phase 4 Definition of Done (Waitlist + Holds + Upgrades + Checkout)

All items must be true before Phase 4 is complete.

## Build + checks
- ✅ API boots with DB connected and Phase 4 migration applied
- ✅ pnpm openapi:lint passes
- ✅ pnpm api:typecheck passes
- ✅ pnpm api:test passes
- ✅ pnpm spec:check passes

## Waitlist
- ✅ POST /v1/waitlist creates an entry
- ✅ GET /v1/waitlist lists entries (optionally filtered by status)
- ✅ POST /v1/waitlist/{id}/cancel cancels an entry
- ✅ Waitlist actions write audit_log entries

## Holds
- ✅ POST /v1/holds creates a hold with TTL
- ✅ Holds reject if inventory already held or assigned
- ✅ POST /v1/holds/{id}/release releases a hold
- ✅ Holds expiration is handled (expired hold does not block a new hold)
- ✅ Hold actions write audit_log entries

## Upgrades
- ✅ POST /v1/upgrades/offer creates a pending offer
- ✅ POST /v1/upgrades/{id}/accept moves assignment safely
- ✅ POST /v1/upgrades/{id}/decline marks offer declined
- ✅ Upgrade actions write audit_log entries

## Checkout
- ✅ POST /v1/checkout/{visitId}/request records a request
- ✅ POST /v1/checkout/{visitId}/complete closes visit, releases assignment, sets inventory DIRTY
- ✅ Checkout actions write audit_log entries

## Contracts
- ✅ OpenAPI matches controllers for paths/methods/status codes
- ✅ ErrorResponse.code enum includes all thrown codes
