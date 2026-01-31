# File Structure

Canonical layout map for the monorepo.

- apps/
  - customer-kiosk/ (Next.js customer kiosk)
  - employee-register/ (Next.js staff register)
  - office-dashboard/ (Next.js admin dashboard)
- packages/
  - ui/ (shared shadcn/ui components)
  - shared/ (shared types + API client)
- services/
  - api/ (NestJS backend)
- docs/ (phase docs + runbooks)
  - database/ (database source of truth + entity details)
- db/ (schema snapshot)
- scripts/ (drift checks and tooling scripts)
- openapi.yaml (HTTP contract source of truth)
- turbo.json (turborepo pipeline)
- pnpm-workspace.yaml (workspace map)
