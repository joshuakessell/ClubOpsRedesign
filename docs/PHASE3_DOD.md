# Phase 3 Definition of Done (Check-in Core)

All items must be true before Phase 3 is complete.

## Build + checks
- ✅ API boots with DB connected and Phase 3 migration applied
- ✅ pnpm openapi:lint passes
- ✅ pnpm api:typecheck passes
- ✅ pnpm api:test passes
- ✅ pnpm spec:check passes

## Visit duration policy
- ✅ Initial visit duration is always 6 hours
- ✅ Renewals are only 2 hours or 6 hours
- ✅ Max total duration is 14 hours from start
- ✅ planned_end_at never exceeds started_at + 14 hours
- ✅ Renewal is rejected if it would exceed max stay

## Customers
- ✅ GET /v1/customers?query= returns matches
- ✅ POST /v1/customers creates a customer

## Visits
- ✅ POST /v1/visits/open creates an ACTIVE visit with planned_end_at + 6h
- ✅ POST /v1/visits/{id}/renew enforces duration policy
- ✅ GET /v1/visits/active?customerId= returns active visit or null
- ✅ POST /v1/visits/{id}/close closes visit and releases assignment

## Assignments
- ✅ POST /v1/visits/{id}/assign requires inventory AVAILABLE
- ✅ Assignment sets inventory to OCCUPIED
- ✅ Close sets inventory to DIRTY

## Agreements
- ✅ POST /v1/agreements/{visitId}/capture writes agreement
- ✅ Second capture returns conflict

## Contracts + audits
- ✅ OpenAPI matches controllers for paths/methods/status codes
- ✅ ErrorResponse.code enum includes all thrown codes
- ✅ All visit/assignment/agreement transitions write audit_log entries
