import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { authHeaders, loginPin, migrateTestDatabase, seedDevice, seedStaff, truncateAll } from './utils/test-helpers';

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

describe('customers', () => {
  it('create customer then search returns it', async () => {
    const staff = await seedStaff({
      identifier: 'cust-staff',
      name: 'Customer Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Customer Device',
      kind: 'register',
      token: 'device-token-customer',
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const createRes = await http
      .post('/v1/customers')
      .set(authHeaders(device, sessionToken))
      .send({ firstName: 'Ava', lastName: 'Query', phone: '555-0101' });

    expect(createRes.status).toBe(201);

    const searchRes = await http
      .get('/v1/customers')
      .set(authHeaders(device, sessionToken))
      .query({ query: 'Query' });

    expect(searchRes.status).toBe(200);
    const match = searchRes.body.items.find((item: { id: string }) => item.id === createRes.body.id);
    expect(match).toBeTruthy();
  });
});
