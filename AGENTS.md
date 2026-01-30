# ClubOpsRedesign Agent Rules (Monorepo)

These rules are mechanically enforceable and must be followed in this repo.

## Stack and scope (non‑negotiable)

- Frontend apps: **Next.js** + **Tailwind CSS v4** + **shadcn/ui**.
- Backend: **NestJS** (HTTP + WebSocket).
- Use **pnpm workspaces** + **Turborepo** for orchestration.
- Prefer **TypeScript** everywhere (no JS-only sources unless requested).

## Source of truth (must stay aligned)

- `SPEC.md` — business invariants + pointers only (keep short).
- `openapi.yaml` — API contract (source of truth for HTTP).
- `docs/database/DATABASE_SOURCE_OF_TRUTH.md` + `docs/database/DATABASE_ENTITY_DETAILS.md` — DB meaning.
- `db/schema.sql` + `services/api/migrations/` — schema snapshot + history.
- `docs/FILE_STRUCTURE.md` — canonical repo layout map (update when structure changes).

If code conflicts with these, update code to match or explicitly update the docs with justification.

## Security + correctness invariants

- Server is authoritative for inventory, eligibility, pricing, assignments, and state transitions.
- WebSocket connections must be authenticated (kiosk token or staff session).
- Staff/admin endpoints require auth; admin endpoints require admin role.
- Concurrency must be safe (transactions + row locking for inventory/assignments).
- Room status transitions follow policy; overrides require reason + audit log.

## UI rules (Next.js + Tailwind 4 + shadcn)

- Use the shadcn **MCP server** to add components (do not copy/paste from docs).
- Keep UI components in `packages/ui` (shared) or `apps/*/components` (app‑local).
- Avoid global CSS except Tailwind base layers and minimal app shell overrides.
- Realtime UI state must be driven by server events, not client assumptions.

## Backend rules (NestJS)

- Controllers are thin; business logic lives in services.
- Separate domain services from data access (repositories or db modules).
- Do not bypass domain services for writes.
- Keep WebSocket event definitions in `packages/shared` and reuse across apps.
- Each domain owns its writes exclusively.
- Cross-domain writes are forbidden.
- Cross-domain reads must go through exported read services, not repositories.
- Phase 1 staff auth is PIN + opaque server session token; WebAuthn is deferred.
- Phase 1 uses `DomainEventsPublisher` with a Noop implementation; no WebSocket gateway unless there is an active consumer.

### Write boundaries (strict)

- Each domain module owns its writes exclusively.
- A domain may not mutate another domain’s state directly.
- Cross-domain effects must occur via:
  - Explicit service orchestration at the application layer, or
  - Domain events handled by the owning module.

Forbidden:
- Importing another domain’s repository
- Writing another domain’s tables directly
- “Helper” write utilities shared across domains

### Read vs write responsibilities

- Write services enforce invariants and transitions.
- Read services aggregate and shape data only.
- Reporting and dashboards must not call write services.
- Write services must not perform reporting-style aggregation.

If a service grows both responsibilities, split it.

## File size + organization

- Avoid bloated files: no file under `apps/**` or `services/**` exceeds 400 lines without approval.
- Organize by **domain** (module/service/controller/DTO in the same domain folder).
- If adding/removing/moving a top‑level area or major package, update `docs/FILE_STRUCTURE.md`.

## CI / quality gates

Run before finishing work (from repo root):

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm spec:check`

## Deployment

- Do **not** add or modify deployment pipelines/infrastructure without explicit request.
- Do **not** add GitHub Actions that deploy.
