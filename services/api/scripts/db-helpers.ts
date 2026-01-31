import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

export type DbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

export function loadDbConfig(): DbConfig {
  const host = process.env.DB_HOST ?? 'localhost';
  const port = Number(process.env.DB_PORT ?? 5432);
  const database = process.env.DB_NAME ?? '';
  const user = process.env.DB_USER ?? '';
  const password = process.env.DB_PASSWORD ?? '';

  if (!database || !user) {
    throw new Error('DB_NAME and DB_USER must be set in the environment.');
  }

  return { host, port, database, user, password };
}

export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const config = loadDbConfig();
  const client = new Client(config);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function getMigrationFiles(): string[] {
  const migrationsDir = path.resolve(__dirname, '../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  return files.map((file) => path.join(migrationsDir, file));
}

export async function ensureMigrationsTable(client: Client) {
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'
  );
}

export async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((row) => row.filename as string));
}

export async function applyMigrations(client: Client, files: string[]) {
  await ensureMigrationsTable(client);
  const applied = await getAppliedMigrations(client);

  for (const file of files) {
    const filename = path.basename(file);
    if (applied.has(filename)) continue;

    const sql = fs.readFileSync(file, 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      // eslint-disable-next-line no-console
      console.log(`Applied ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}
