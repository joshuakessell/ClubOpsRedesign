import request from 'supertest';
import { randomUUID } from 'crypto';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  loginPin,
  migrateTestDatabase,
  seedCustomer,
  seedDevice,
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

describe('waitlist', () => {
  it('create waitlist entry then list returns it', async () => {
    const staff = await seedStaff({
      identifier: 'waitlist-staff',
      name: 'Waitlist Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Waitlist Device',
      kind: 'register',
      token: 'device-token-waitlist',
    });
    const customer = await seedCustomer({
      firstName: 'Willa',
      lastName: 'List',
      phone: '555-1010',
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const createRes = await http
      .post('/v1/waitlist')
      .set(authHeaders(device, sessionToken))
      .send({
        customerId: customer.id,
        requestedType: 'room',
        notes: 'near front',
      });

    expect(createRes.status).toBe(201);

    const listRes = await http.get('/v1/waitlist').set(authHeaders(device, sessionToken));

    expect(listRes.status).toBe(200);
    const match = listRes.body.items.find((item: { id: string }) => item.id === createRes.body.id);
    expect(match).toBeTruthy();
  });

  it('cancel waitlist entry returns cancelled status', async () => {
    const staff = await seedStaff({
      identifier: 'waitlist-cancel-staff',
      name: 'Waitlist Cancel Staff',
      role: 'staff',
      pin: '4321',
    });
    const device = await seedDevice({
      name: 'Waitlist Cancel Device',
      kind: 'register',
      token: 'device-token-waitlist-cancel',
    });
    const customer = await seedCustomer({
      firstName: 'Cory',
      lastName: 'Cancel',
      phone: '555-2020',
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const createRes = await http
      .post('/v1/waitlist')
      .set(authHeaders(device, sessionToken))
      .send({
        customerId: customer.id,
        requestedType: 'locker',
      });

    expect(createRes.status).toBe(201);

    const cancelRes = await http
      .post(`/v1/waitlist/${createRes.body.id}/cancel`)
      .set(authHeaders(device, sessionToken))
      .send();

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');
  });

  it('cancel non-existent waitlist entry returns 404', async () => {
    const staff = await seedStaff({
      identifier: 'waitlist-missing-staff',
      name: 'Waitlist Missing Staff',
      role: 'staff',
      pin: '9999',
    });
    const device = await seedDevice({
      name: 'Waitlist Missing Device',
      kind: 'register',
      token: 'device-token-waitlist-missing',
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const cancelRes = await http
      .post(`/v1/waitlist/${randomUUID()}/cancel`)
      .set(authHeaders(device, sessionToken))
      .send();

    expect(cancelRes.status).toBe(404);
    expect(cancelRes.body.code).toBe('WAITLIST_NOT_FOUND');
  });
});
