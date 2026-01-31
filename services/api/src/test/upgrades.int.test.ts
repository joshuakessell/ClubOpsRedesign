import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  fetchActiveVisitAssignment,
  fetchInventoryItem,
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

describe('upgrades', () => {
  it('accept upgrade changes assignment safely', async () => {
    const staff = await seedStaff({
      identifier: 'upgrade-staff',
      name: 'Upgrade Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Upgrade Device',
      kind: 'register',
      token: 'device-token-upgrade',
    });
    const customer = await seedCustomer({ firstName: 'Upgrade', lastName: 'Guest' });

    const currentItem = await seedInventoryItem({ type: 'room', name: '701', status: 'AVAILABLE' });
    const targetItem = await seedInventoryItem({ type: 'locker', name: '801', status: 'AVAILABLE' });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const visitRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    const assignRes = await http
      .post(`/v1/visits/${visitRes.body.id}/assign`)
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: currentItem.id });

    expect(assignRes.status).toBe(200);

    const offerRes = await http
      .post('/v1/upgrades/offer')
      .set(authHeaders(device, sessionToken))
      .send({
        visitId: visitRes.body.id,
        fromInventoryItemId: currentItem.id,
        toInventoryType: 'locker',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });

    expect(offerRes.status).toBe(201);

    const acceptRes = await http
      .post(`/v1/upgrades/${offerRes.body.id}/accept`)
      .set(authHeaders(device, sessionToken))
      .send();

    expect(acceptRes.status).toBe(200);

    const assignment = await fetchActiveVisitAssignment(visitRes.body.id as string);
    expect(assignment?.inventory_item_id).toBe(targetItem.id);

    const currentInventory = await fetchInventoryItem(currentItem.id);
    const targetInventory = await fetchInventoryItem(targetItem.id);
    expect(currentInventory?.status).toBe('DIRTY');
    expect(targetInventory?.status).toBe('OCCUPIED');
  });
});
