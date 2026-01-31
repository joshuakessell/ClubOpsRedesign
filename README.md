# ClubOpsRedesign

Phase 1–4 monorepo (NestJS API + Next.js apps) using pnpm workspaces and Turborepo.

## Quickstart

```bash
pnpm install

docker compose up -d
pnpm -C services/api db:migrate
pnpm -C services/api db:seed

pnpm dev
```

## Ports

- API: http://localhost:3001/v1/health
- Customer kiosk: http://localhost:3000
- Employee register: http://localhost:3002
- Office dashboard: http://localhost:3003

## Database scripts

```bash
pnpm -C services/api db:migrate
pnpm -C services/api db:reset
pnpm -C services/api db:seed
```
