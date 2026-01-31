import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  loginPin,
  migrateTestDatabase,
  seedDevice,
  seedInventoryItem,
  seedKeyTag,
  seedStaff,
  truncateAll,
} from './utils/test-helpers';

let app: Awaited<ReturnType<typeof createTestApp>>;
let http: request.SuperTest<request.Test>;

beforeAll(async () => {
  await migrateTestDatabase();
  app = await createTestApp();
  http = request(app.getHttpServer());
});

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('keys', () => {
  it('scan resolves key tag to inventory item', async () => {
    const staff = await seedStaff({
      identifier: 'staff-keys',
      name: 'Keys Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Keys Device',
      kind: 'register',
      token: 'device-token-keys',
    });
    const item = await seedInventoryItem({ type: 'locker', name: '200' });
    await seedKeyTag({ tagCode: 'TAG-XYZ', assignedToItemId: item.id });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const response = await http
      .post('/v1/keys/scan')
      .set(authHeaders(device, sessionToken))
      .send({ tagCode: 'TAG-XYZ' });

    expect(response.status).toBe(200);
    expect(response.body.keyTag.tagCode).toBe('TAG-XYZ');
    expect(response.body.item.id).toBe(item.id);
  });
});
