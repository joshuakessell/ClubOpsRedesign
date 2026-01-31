import { randomBytes, randomUUID } from 'crypto';
import { withClient } from './db-helpers';
import { hashSecretWithSalt, hashTokenDeterministic } from '../src/platform/security/hash';

async function run() {
  await withClient(async (client) => {
    const staffIdentifier = 'dev-admin';
    const staffPin = '1234';
    const staffName = 'Dev Admin';
    const staffId = randomUUID();
    const pinHash = hashSecretWithSalt(staffPin);

    const staffResult = await client.query(
      `INSERT INTO staff (id, identifier, name, pin_hash, role, enabled)
       VALUES ($1, $2, $3, $4, 'admin', true)
       ON CONFLICT (identifier) DO UPDATE
         SET name = EXCLUDED.name,
             pin_hash = EXCLUDED.pin_hash,
             role = EXCLUDED.role,
             enabled = EXCLUDED.enabled
       RETURNING id, identifier`,
      [staffId, staffIdentifier, staffName, pinHash]
    );

    const deviceId = randomUUID();
    const deviceToken = randomBytes(16).toString('hex');
    const deviceTokenHash = hashTokenDeterministic(deviceToken);

    const deviceResult = await client.query(
      `INSERT INTO devices (id, name, kind, enabled, device_token_hash, last_seen_at)
       VALUES ($1, $2, $3, true, $4, null)
       RETURNING id, name`,
      [deviceId, 'Dev Register', 'register', deviceTokenHash]
    );

    // eslint-disable-next-line no-console
    console.log('\nSeed complete. Use these credentials:');
    // eslint-disable-next-line no-console
    console.log(`Staff identifier: ${staffResult.rows[0].identifier}`);
    // eslint-disable-next-line no-console
    console.log(`Staff PIN: ${staffPin}`);
    // eslint-disable-next-line no-console
    console.log(`Device ID: ${deviceResult.rows[0].id}`);
    // eslint-disable-next-line no-console
    console.log(`Device token: ${deviceToken}`);
  });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});
