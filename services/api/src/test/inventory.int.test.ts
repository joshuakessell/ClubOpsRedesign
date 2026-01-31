import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
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

describe('inventory', () => {
  it('lists inventory items', async () => {
    const staff = await seedStaff({
      identifier: 'staff-inv',
      name: 'Inventory Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Inventory Device',
      kind: 'register',
      token: 'device-token-inv',
    });

    await seedInventoryItem({ type: 'room', name: '101' });
    await seedInventoryItem({ type: 'locker', name: 'L1' });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const response = await http
      .get('/v1/inventory/items')
      .set(authHeaders(device, sessionToken))
      .send();

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
  });

  it('rejects invalid status transitions', async () => {
    const staff = await seedStaff({
      identifier: 'staff-inv2',
      name: 'Inventory Staff 2',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Inventory Device 2',
      kind: 'register',
      token: 'device-token-inv2',
    });
    const item = await seedInventoryItem({ type: 'room', name: '102', status: 'AVAILABLE' });
    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const response = await http
      .patch(`/v1/inventory/items/${item.id}/status`)
      .set(authHeaders(device, sessionToken))
      .send({ toStatus: 'CLEANING' });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
