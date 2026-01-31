import { applyMigrations, getMigrationFiles, withClient } from './db-helpers';

async function run() {
  const files = getMigrationFiles();
  await withClient(async (client) => {
    await applyMigrations(client, files);
  });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  process.exit(1);
});
