import { applyMigrations, getMigrationFiles, withClient } from './db-helpers';

async function run() {
  const files = getMigrationFiles();
  await withClient(async (client) => {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    await applyMigrations(client, files);
  });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Reset failed:', error);
  process.exit(1);
});
