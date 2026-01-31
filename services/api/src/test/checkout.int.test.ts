import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  fetchInventoryItem,
  fetchVisitAssignment,
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

describe('checkout', () => {
  it('checkout closes visit and sets inventory to DIRTY', async () => {
    const staff = await seedStaff({
      identifier: 'checkout-staff',
      name: 'Checkout Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Checkout Device',
      kind: 'register',
      token: 'device-token-checkout',
    });
    const customer = await seedCustomer({ firstName: 'Checkout', lastName: 'Guest' });
    const item = await seedInventoryItem({ type: 'room', name: '901', status: 'AVAILABLE' });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const visitRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    await http
      .post(`/v1/visits/${visitRes.body.id}/assign`)
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id });

    const completeRes = await http
      .post(`/v1/checkout/${visitRes.body.id}/complete`)
      .set(authHeaders(device, sessionToken))
      .send();

    expect(completeRes.status).toBe(200);

    const inventory = await fetchInventoryItem(item.id);
    expect(inventory?.status).toBe('DIRTY');

    const assignment = await fetchVisitAssignment(visitRes.body.id as string);
    expect(assignment?.released_at).not.toBeNull();
  });
});
