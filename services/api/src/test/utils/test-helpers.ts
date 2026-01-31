import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { hashSecretWithSalt, hashTokenDeterministic } from '../../platform/security/hash';

const migrationPath = path.resolve(
  __dirname,
  '../../../migrations/0001_phase1_staff_devices_register_sessions.sql'
);

function requireTestDb(): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  const host = process.env.DB_HOST ?? 'localhost';
  const port = Number(process.env.DB_PORT ?? 5432);
  const database = process.env.DB_NAME ?? '';
  const user = process.env.DB_USER ?? '';
  const password = process.env.DB_PASSWORD ?? '';
  if (!database || !database.endsWith('_test')) {
    throw new Error(`Refusing to run tests without a test database. DB_NAME=${database || 'undefined'}`);
  }
  return { host, port, database, user, password };
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const config = requireTestDb();
  const client = new Client(config);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

let migrated = false;

export async function migrateTestDatabase(): Promise<void> {
  if (migrated) return;
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await withClient(async (client) => {
    await client.query('SELECT pg_advisory_lock(987654321)');
    try {
      const exists = await client.query("SELECT to_regclass('public.staff') AS table_name");
      if (!exists.rows[0]?.table_name) {
        await client.query(sql);
      }
      migrated = true;
    } finally {
      await client.query('SELECT pg_advisory_unlock(987654321)');
    }
  });
}

export async function truncateAll(): Promise<void> {
  await withClient((client) =>
    client.query(
      'TRUNCATE TABLE audit_log, staff_sessions, register_sessions, devices, staff RESTART IDENTITY'
    )
  );
}

export type SeedStaffInput = {
  id?: string;
  identifier: string;
  name: string;
  role: 'staff' | 'admin';
  pin: string;
  enabled?: boolean;
};

export type SeedDeviceInput = {
  id?: string;
  name: string;
  kind: 'register' | 'kiosk' | 'office';
  token: string;
  enabled?: boolean;
};

export async function seedStaff(input: SeedStaffInput): Promise<SeedStaffInput & { id: string }> {
  const id = input.id ?? randomUUID();
  const enabled = input.enabled ?? true;
  const pinHash = hashSecretWithSalt(input.pin);
  await withClient((client) =>
    client.query(
      'INSERT INTO staff (id, identifier, name, pin_hash, role, enabled) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, input.identifier, input.name, pinHash, input.role, enabled]
    )
  );
  return { ...input, id, enabled };
}

export async function seedDevice(input: SeedDeviceInput): Promise<SeedDeviceInput & { id: string }> {
  const id = input.id ?? randomUUID();
  const enabled = input.enabled ?? true;
  const tokenHash = hashTokenDeterministic(input.token);
  await withClient((client) =>
    client.query(
      'INSERT INTO devices (id, name, kind, enabled, device_token_hash, last_seen_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, input.name, input.kind, enabled, tokenHash, null]
    )
  );
  return { ...input, id, enabled };
}

export async function seedAuditRow(params: {
  actorStaffId?: string | null;
  actorDeviceId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}): Promise<{ id: string; entityId: string }> {
  const id = randomUUID();
  const entityId = params.entityId ?? randomUUID();
  const metadata = params.metadata ?? {};
  await withClient((client) =>
    client.query(
      'INSERT INTO audit_log (id, actor_staff_id, actor_device_id, action, entity_type, entity_id, metadata, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        id,
        params.actorStaffId ?? null,
        params.actorDeviceId ?? null,
        params.action,
        params.entityType,
        entityId,
        JSON.stringify(metadata),
        params.createdAt ?? new Date(),
      ]
    )
  );
  return { id, entityId };
}

export async function fetchRegisterSession(sessionId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      'SELECT id, signed_out_at, signed_out_reason, last_heartbeat_at FROM register_sessions WHERE id=$1',
      [sessionId]
    );
    return result.rows[0] as {
      id: string;
      signed_out_at: Date | null;
      signed_out_reason: string | null;
      last_heartbeat_at: Date;
    } | undefined;
  });
}

export async function countAuditActions(entityId: string, action: string): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query(
      'SELECT COUNT(*)::int AS count FROM audit_log WHERE entity_id=$1 AND action=$2',
      [entityId, action]
    );
    return result.rows[0]?.count ?? 0;
  });
}

export function deviceHeaders(device: { id: string; token: string }): Record<string, string> {
  return {
    'x-device-id': device.id,
    'x-device-token': device.token,
  };
}

export function authHeaders(
  device: { id: string; token: string },
  sessionToken: string
): Record<string, string> {
  return {
    ...deviceHeaders(device),
    Authorization: `Bearer ${sessionToken}`,
  };
}

export async function loginPin(
  app: INestApplication,
  device: { id: string; token: string },
  identifier: string,
  pin: string
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/v1/auth/login-pin')
    .set(deviceHeaders(device))
    .send({ identifier, pin });

  if (response.status !== 200) {
    throw new Error(`Expected login to succeed, got ${response.status}: ${JSON.stringify(response.body)}`);
  }

  return response.body.sessionToken as string;
}
