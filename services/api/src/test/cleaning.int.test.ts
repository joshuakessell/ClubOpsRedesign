import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  fetchInventoryItem,
  loginPin,
  migrateTestDatabase,
  seedDevice,
  seedInventoryItem,
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

describe('cleaning', () => {
  it('transitions items in a cleaning batch', async () => {
    const staff = await seedStaff({
      identifier: 'staff-clean',
      name: 'Cleaning Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Cleaning Device',
      kind: 'register',
      token: 'device-token-clean',
    });
    const item = await seedInventoryItem({
      type: 'room',
      name: '201',
      status: 'DIRTY',
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const response = await http
      .post('/v1/cleaning/batch')
      .set(authHeaders(device, sessionToken))
      .send({ itemIds: [item.id], toStatus: 'CLEANING' });

    expect(response.status).toBe(200);
    expect(response.body.results[0].status).toBe('UPDATED');
    expect(response.body.results[0].itemId).toBe(item.id);

    const updated = await fetchInventoryItem(item.id);
    expect(updated?.status).toBe('CLEANING');
  });
});
