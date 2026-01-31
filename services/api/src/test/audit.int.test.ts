import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  authHeaders,
  loginPin,
  migrateTestDatabase,
  seedAuditRow,
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

describe('admin audit pagination', () => {
  it('returns items with nextCursor and paginates correctly', async () => {
    const staff = await seedStaff({
      identifier: 'admin-audit',
      name: 'Admin Audit',
      role: 'admin',
      pin: '1234',
    });
    const device = await seedDevice({
      name: 'Audit Device',
      kind: 'office',
      token: 'device-token-audit',
    });

    const base = new Date('2026-01-01T00:00:00.000Z');
    await seedAuditRow({
      actorStaffId: staff.id,
      actorDeviceId: device.id,
      action: 'AUDIT_ROW_ONE',
      entityType: 'device',
      createdAt: new Date(base.getTime() + 1000),
    });
    await seedAuditRow({
      actorStaffId: staff.id,
      actorDeviceId: device.id,
      action: 'AUDIT_ROW_TWO',
      entityType: 'device',
      createdAt: new Date(base.getTime() + 2000),
    });
    await seedAuditRow({
      actorStaffId: staff.id,
      actorDeviceId: device.id,
      action: 'AUDIT_ROW_THREE',
      entityType: 'device',
      createdAt: new Date(base.getTime() + 3000),
    });

    const sessionToken = await loginPin(app, device, staff.identifier, staff.pin);

    const first = await http
      .get('/v1/admin/audit?limit=2')
      .set(authHeaders(device, sessionToken));

    expect(first.status).toBe(200);
    expect(first.body.items).toHaveLength(2);
    expect(typeof first.body.nextCursor).toBe('string');

    const second = await http
      .get(`/v1/admin/audit?limit=2&cursor=${first.body.nextCursor}`)
      .set(authHeaders(device, sessionToken));

    expect(second.status).toBe(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.nextCursor).toBeNull();
  });
});
