# Phase 1 Definition of Done

Use this checklist before moving to Phase 2. Every item must be true.

## Build and contract
- ✅ API boots with DB connected
- ✅ `pnpm openapi:lint` passes
- ✅ `pnpm api:typecheck` passes
- ✅ `pnpm api:test` passes
- ✅ `pnpm spec:check` passes

## Register sessions
- ✅ One active session per register enforced by DB constraint
- ✅ One active session per device enforced by DB constraint
- ✅ Heartbeat updates `last_heartbeat_at` only for active sessions
- ✅ TTL closes sessions and writes audit entries
- ✅ Admin force sign-out is idempotent

## Auth
- ✅ Staff PIN login returns an opaque session token
- ✅ Revoked/expired sessions are rejected
- ✅ Device/session mismatch is rejected

## Devices
- ✅ Unknown device is rejected
- ✅ Disabled device is rejected
- ✅ Admin device disable forces sign-out

## Audit
- ✅ Audit writes occur for register and device actions
- ✅ Admin audit list endpoint paginates via cursor

## Contract discipline
- ✅ All controller routes exist in `openapi.yaml` (OpenAPI is authoritative)
- ✅ Phase 1 boundaries are enforced by `pnpm phase1:check`
