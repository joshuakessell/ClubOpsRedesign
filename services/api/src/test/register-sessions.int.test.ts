import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  countAuditActions,
  deviceHeaders,
  fetchRegisterSession,
  loginPin,
  migrateTestDatabase,
  seedDevice,
  seedStaff,
  truncateAll,
} from './utils/test-helpers';
import { RegisterSessionTtlJob } from '../platform/jobs/register-session-ttl.job';

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

describe('register sessions', () => {
  it('concurrent open same registerNumber: one succeeds, one 409 REGISTER_ACTIVE_CONFLICT', async () => {
    const staff = await seedStaff({
      identifier: 'admin1',
      name: 'Admin One',
      role: 'admin',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Register A',
      kind: 'register',
      token: 'device-token-a',
    });
    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const payload = { registerNumber: 1 };
    const headers = authHeaders(device, sessionToken);

    const [res1, res2] = await Promise.all([
      http.post('/v1/register-sessions/open').set(headers).send(payload),
      http.post('/v1/register-sessions/open').set(headers).send(payload),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const conflict = res1.status === 409 ? res1 : res2;
    expect(conflict.body.code).toBe('REGISTER_ACTIVE_CONFLICT');
  });

  it('concurrent open same device: one succeeds, one 409 DEVICE_ACTIVE_CONFLICT', async () => {
    const staff = await seedStaff({
      identifier: 'staff1',
      name: 'Staff One',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Register B',
      kind: 'register',
      token: 'device-token-b',
    });
    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const headers = authHeaders(device, sessionToken);
    const [res1, res2] = await Promise.all([
      http.post('/v1/register-sessions/open').set(headers).send({ registerNumber: 1 }),
      http.post('/v1/register-sessions/open').set(headers).send({ registerNumber: 2 }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const conflict = res1.status === 409 ? res1 : res2;
    expect(conflict.body.code).toBe('DEVICE_ACTIVE_CONFLICT');
  });

  it('heartbeat device mismatch returns 403 FORBIDDEN', async () => {
    const staff = await seedStaff({
      identifier: 'staff2',
      name: 'Staff Two',
      role: 'staff',
      pin: '1234',
    });
    const deviceA = await seedDevice({
      name: 'Register C',
      kind: 'register',
      token: 'device-token-c',
    });
    const deviceB = await seedDevice({
      name: 'Register D',
      kind: 'register',
      token: 'device-token-d',
    });

    const sessionToken = await loginPin(app, deviceA, staff.identifier, staff.pin);
    const openRes = await http
      .post('/v1/register-sessions/open')
      .set(authHeaders(deviceA, sessionToken))
      .send({ registerNumber: 1 });

    expect(openRes.status).toBe(201);

    const heartbeatRes = await http
      .post(`/v1/register-sessions/${openRes.body.id}/heartbeat`)
      .set({
        ...deviceHeaders(deviceB),
        Authorization: `Bearer ${sessionToken}`,
      })
      .send();

    expect(heartbeatRes.status).toBe(403);
    expect(heartbeatRes.body.code).toBe('FORBIDDEN');
  });

  it('TTL expiry ends sessions and is idempotent', async () => {
    const staff = await seedStaff({
      identifier: 'staff3',
      name: 'Staff Three',
      role: 'staff',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Register E',
      kind: 'register',
      token: 'device-token-e',
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);
    const openRes = await http
      .post('/v1/register-sessions/open')
      .set(authHeaders(device, sessionToken))
      .send({ registerNumber: 1 });

    expect(openRes.status).toBe(201);
    const sessionId = openRes.body.id as string;

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const ttlJob = app.get(RegisterSessionTtlJob);
    await ttlJob.runOnce();
    await ttlJob.runOnce();

    const session = await fetchRegisterSession(sessionId);
    expect(session?.signed_out_reason).toBe('TTL_EXPIRED');

    const auditCount = await countAuditActions(sessionId, 'REGISTER_SESSION_TTL_EXPIRED');
    expect(auditCount).toBe(1);
  });
});
