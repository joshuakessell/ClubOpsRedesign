import request from 'supertest';
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

describe('agreements', () => {
  it('agreement capture conflict on second call', async () => {
    const staff = await seedStaff({
      identifier: 'agree-staff',
      name: 'Agreement Staff',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Agreement Device',
      kind: 'register',
      token: 'device-token-agree',
    });
    const customer = await seedCustomer({ firstName: 'Agree', lastName: 'Once' });
    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const openRes = await http
      .post('/v1/visits/open')
      .set(authHeaders(device, sessionToken))
      .send({ customerId: customer.id });

    const capture1 = await http
      .post(`/v1/agreements/${openRes.body.id}/capture`)
      .set(authHeaders(device, sessionToken))
      .send({ status: 'SIGNED', method: 'REGISTER' });

    expect(capture1.status).toBe(200);

    const capture2 = await http
      .post(`/v1/agreements/${openRes.body.id}/capture`)
      .set(authHeaders(device, sessionToken))
      .send({ status: 'SIGNED', method: 'REGISTER' });

    expect(capture2.status).toBe(409);
    expect(capture2.body.code).toBe('AGREEMENT_ALREADY_CAPTURED');
  });
});
