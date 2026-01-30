# Phase 1 Integration Test Plan

Scope: staff PIN auth, device allowlist, register sessions (lifecycle + heartbeat + TTL), admin force sign-out, audit writes.

## Concurrency and race safety

1. Concurrent open (same register number)
   - Given: register number N (1..3), two valid staff sessions on different devices
   - When: two POST /v1/register-sessions/open requests start at the same time for N
   - Then: exactly one succeeds with 201; the other returns 409
   - And: database has only one active session for register N

2. Concurrent open (same device)
   - Given: same device, two valid staff sessions
   - When: two POST /v1/register-sessions/open requests start at the same time
   - Then: exactly one succeeds; the other returns 409
   - And: database has only one active session for that device

## Heartbeat and active-session validation

3. Heartbeat updates last_heartbeat_at for active session
   - Given: active register session, enabled device, valid staff session
   - When: POST /v1/register-sessions/{id}/heartbeat
   - Then: last_heartbeat_at is updated, response is 200

4. Heartbeat rejects invalid session
   - Given: session id does not exist
   - When: heartbeat request
   - Then: 404 error

5. Heartbeat rejects ended session
   - Given: session is signed_out_at != null
   - When: heartbeat request
   - Then: 409 error

6. Heartbeat rejects device mismatch or disabled device
   - Given: session exists but device headers do not match or device disabled
   - When: heartbeat request
   - Then: 403 error

## TTL expiry and idempotency

7. TTL expiry ends sessions
   - Given: active session with last_heartbeat_at older than TTL
   - When: TTL job runs
   - Then: session is closed, ended_reason = TTL_EXPIRED

8. TTL expiry idempotency
   - Given: a session already ended by TTL
   - When: TTL job runs again
   - Then: no changes, no duplicate audit entries

## Admin force sign-out

9. Force sign-out closes active session
   - Given: active session for register N
   - When: POST /v1/admin/register-sessions/{N}/force-signout
   - Then: session closes, ended_reason = FORCED_SIGN_OUT

10. Force sign-out idempotency
   - Given: session already ended
   - When: force sign-out
   - Then: 200 OK with unchanged session

## Device policy

11. Unknown device rejected
   - Given: x-device-id not in DB or invalid token
   - When: any protected endpoint called
   - Then: 401 error

12. Disabled device rejected
   - Given: device enabled = false
   - When: any protected endpoint called
   - Then: 403 error

13. Disabling a device force-closes active session
   - Given: active session for device D
   - When: PATCH /v1/admin/devices/{D} enabled=false
   - Then: session is closed with ended_reason = FORCED_SIGN_OUT

## Staff auth failures

14. Invalid session token
   - Given: Bearer token not found
   - When: staff-protected endpoint called
   - Then: 401 error

15. Expired session token
   - Given: staff session expires_at < now
   - When: staff-protected endpoint called
   - Then: 401 error

16. Disabled staff
   - Given: staff enabled = false
   - When: login-pin or staff-protected endpoint called
   - Then: 403 error

## Audit logging

17. Register session open writes audit entry
   - Given: successful /register-sessions/open
   - Then: audit_log row created with action and entity_id

18. Force sign-out writes audit entry
   - Given: admin force sign-out
   - Then: audit_log row created

19. TTL expiry writes audit entry
   - Given: TTL job closes sessions
   - Then: audit_log row created for each closed session
