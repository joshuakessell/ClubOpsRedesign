# Phase 1 Runbook

## Prerequisites
- pnpm (repo uses `pnpm@10.27.0`)
- PostgreSQL (local)

## Start Postgres (local)
- Ensure Postgres is running and the DB/user exist per your env.

## Configure environment
- Copy `services/api/.env.example` to `services/api/.env` and adjust values.
- Export the same variables in your shell if not using a dotenv loader.

## Apply migration
- File: `services/api/migrations/0001_phase1_staff_devices_register_sessions.sql`
- Example:
  - `psql "$DB_NAME" -f services/api/migrations/0001_phase1_staff_devices_register_sessions.sql`

## Start the API
- Example (using on-demand TypeScript runner):
  - `pnpm dlx ts-node --transpile-only services/api/src/main.ts`

## Run checks (from repo root)
- `pnpm openapi:lint`
- `pnpm api:typecheck`
- `pnpm api:test`
- `pnpm spec:check`
