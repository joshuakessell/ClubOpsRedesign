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

describe('visits', () => {
  async function setupStaffAndDevice() {
    const staff = await seedStaff({
      identifier: 'visit-staff',
      name: 'Visit Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Visit Device',
      kind: 'register',
      token: 'device-token-visit',
    });
    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);
    return { staff, device, sessionToken };
  }

  it('open visit sets planned_end_at + 6h', async () => {
    const { device, sessionToken } = await setupStaffAndDevice();
    const customer = await seedCustomer({ firstName: 'Sam', lastName: 'Guest' });

    const response = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    expect(response.status).toBe(201);
    const startedAt = new Date(response.body.startedAt);
    const plannedEndAt = new Date(response.body.plannedEndAt);
    const diffMinutes = Math.round((plannedEndAt.getTime() - startedAt.getTime()) / 60000);
    expect(diffMinutes).toBe(360);
  });

  it('renew visit adds 2h', async () => {
    const { device, sessionToken } = await setupStaffAndDevice();
    const customer = await seedCustomer({ firstName: 'Rene', lastName: 'Walsh' });

    const openRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    const renewRes = await http
      .post(`/v1/visits/${openRes.body.id}/renew`)
      .set(authHeaders(device, sessionToken))
      .send({ durationMinutes: 120 });

    expect(renewRes.status).toBe(200);
    const startedAt = new Date(renewRes.body.startedAt);
    const plannedEndAt = new Date(renewRes.body.plannedEndAt);
    const diffMinutes = Math.round((plannedEndAt.getTime() - startedAt.getTime()) / 60000);
    expect(diffMinutes).toBe(480);
  });

  it('renew visit rejected if exceeds max duration', async () => {
    const { device, sessionToken } = await setupStaffAndDevice();
    const customer = await seedCustomer({ firstName: 'Max', lastName: 'Limit' });

    const openRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    const firstRenew = await http
      .post(`/v1/visits/${openRes.body.id}/renew`)
      .set(authHeaders(device, sessionToken))
      .send({ durationMinutes: 360 });

    expect(firstRenew.status).toBe(200);

    const secondRenew = await http
      .post(`/v1/visits/${openRes.body.id}/renew`)
      .set(authHeaders(device, sessionToken))
      .send({ durationMinutes: 360 });

    expect(secondRenew.status).toBe(409);
    expect(secondRenew.body.code).toBe('VISIT_MAX_DURATION_EXCEEDED');
  });

  it('assign inventory changes status to OCCUPIED', async () => {
    const { device, sessionToken } = await setupStaffAndDevice();
    const customer = await seedCustomer({ firstName: 'Amy', lastName: 'Assign' });
    const item = await seedInventoryItem({ type: 'room', name: '301', status: 'AVAILABLE' });

    const openRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    const assignRes = await http
      .post(`/v1/visits/${openRes.body.id}/assign`)
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id });

    expect(assignRes.status).toBe(200);
    const inventory = await fetchInventoryItem(item.id);
    expect(inventory?.status).toBe('OCCUPIED');
  });

  it('close visit releases assignment and sets inventory to DIRTY', async () => {
    const { device, sessionToken } = await setupStaffAndDevice();
    const customer = await seedCustomer({ firstName: 'Clara', lastName: 'Close' });
    const item = await seedInventoryItem({ type: 'locker', name: '401', status: 'AVAILABLE' });

    const openRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    await http
      .post(`/v1/visits/${openRes.body.id}/assign`)
      .set(authHeaders(device, sessionToken))
      .send({ inventoryItemId: item.id });

    const closeRes = await http
      .post(`/v1/visits/${openRes.body.id}/close`)
      .set(authHeaders(device, sessionToken))
      .send();

    expect(closeRes.status).toBe(200);
    const inventory = await fetchInventoryItem(item.id);
    expect(inventory?.status).toBe('DIRTY');

    const assignment = await fetchVisitAssignment(openRes.body.id as string);
    expect(assignment?.released_at).not.toBeNull();
  });
});
