import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  fetchHold,
  loginPin,
  migrateTestDatabase,
  seedCustomer,
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

describe('holds', () => {
  it('hold conflict on same inventory item', async () => {
    const staff = await seedStaff({
      identifier: 'hold-staff',
      name: 'Hold Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Hold Device',
      kind: 'register',
      token: 'device-token-hold',
    });
    await seedCustomer({ firstName: 'Hold', lastName: 'Guest' });
    const item = await seedInventoryItem({ type: 'room', name: '501', status: 'AVAILABLE' });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    const first = await http
      .post('/v1/holds')
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id, expiresAt });

    expect(first.status).toBe(201);

    const second = await http
      .post('/v1/holds')
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id, expiresAt });

    expect(second.status).toBe(409);
    expect(second.body.code).toBe('HOLD_CONFLICT');
  });

  it('expired hold allows new hold', async () => {
    const staff = await seedStaff({
      identifier: 'hold-expire',
      name: 'Hold Expire',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Hold Device 2',
      kind: 'register',
      token: 'device-token-hold2',
    });
    const item = await seedInventoryItem({ type: 'locker', name: '601', status: 'AVAILABLE' });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);
    const expiresAt = new Date(Date.now() + 1000).toISOString();

    const first = await http
      .post('/v1/holds')
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id, expiresAt });

    expect(first.status).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const secondExpires = new Date(Date.now() + 60_000).toISOString();
    const second = await http
      .post('/v1/holds')
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id, expiresAt: secondExpires });

    expect(second.status).toBe(201);

    const firstHold = await fetchHold(first.body.id as string);
    expect(firstHold?.status).toBe('EXPIRED');
  });
});
