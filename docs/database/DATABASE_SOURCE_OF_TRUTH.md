# Database Source of Truth

- PostgreSQL is authoritative for persistent state.
- Migrations in `services/api/migrations/` are append-only and are the canonical history.
- `db/schema.sql` is a generated snapshot of the full schema and must match the applied migrations exactly.
- Runtime schema drift is not allowed; schema changes must flow through migrations.
- Foreign keys and CHECK/UNIQUE constraints are mandatory invariants.
- Application code must not re-implement or bypass database guarantees.
