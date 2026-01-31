import { createApiClient, type components } from '@clubops/shared';
import type { DeviceAuth } from '@clubops/shared';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1';

export type DeviceDto = components['schemas']['DeviceDTO'];
export type StaffListResponse = components['schemas']['StaffListResponse'];
export type StaffLoginResponse = components['schemas']['StaffLoginResponse'];
export type StaffSessionDto = components['schemas']['StaffSessionDTO'];
export type RegisterAvailabilityResponse = components['schemas']['RegisterAvailabilityResponse'];
export type RegisterAvailabilityItem = components['schemas']['RegisterAvailabilityItem'];
export type RegisterNumber = components['schemas']['RegisterNumber'];
export type RegisterSessionDto = components['schemas']['RegisterSessionDTO'];
export type RegisterSessionNullableResponse =
  components['schemas']['RegisterSessionNullableResponse'];
export type CustomerListResponse = components['schemas']['CustomerListResponse'];
export type CustomerDto = components['schemas']['CustomerDTO'];

function client(device?: DeviceAuth, staffToken?: string) {
  return createApiClient({
    baseUrl,
    deviceId: device?.deviceId,
    deviceToken: device?.deviceToken,
    staffToken,
  });
}

export async function fetchDeviceMe(device: DeviceAuth): Promise<DeviceDto> {
  const api = client(device);
  const response = (await api.request('/devices/me', 'get')) as DeviceDto | undefined;
  if (!response) {
    throw new Error('No device response returned.');
  }
  return response;
}

export async function fetchStaffList(device: DeviceAuth): Promise<StaffListResponse> {
  const api = client(device);
  const response = (await api.request('/auth/staff', 'get')) as StaffListResponse | undefined;
  if (!response) {
    throw new Error('No staff list response returned.');
  }
  return response;
}

export async function loginWithPin(
  device: DeviceAuth,
  identifier: string,
  pin: string
): Promise<StaffLoginResponse> {
  const api = client(device);
  const response = (await api.request('/auth/login-pin', 'post', {
    body: { identifier, pin },
  })) as StaffLoginResponse | undefined;
  if (!response) {
    throw new Error('No login response returned.');
  }
  return response;
}

export async function fetchMe(device: DeviceAuth, staffToken: string): Promise<StaffSessionDto> {
  const api = client(device, staffToken);
  const response = (await api.request('/auth/me', 'get')) as StaffSessionDto | undefined;
  if (!response) {
    throw new Error('No session response returned.');
  }
  return response;
}

export async function getRegisterAvailability(
  device: DeviceAuth,
  staffToken: string
): Promise<RegisterAvailabilityResponse> {
  const api = client(device, staffToken);
  const response = (await api.request(
    '/registers/availability',
    'get'
  )) as RegisterAvailabilityResponse | undefined;
  if (!response) {
    throw new Error('No register availability response returned.');
  }
  return response;
}

export async function getActiveRegisterSession(
  device: DeviceAuth,
  staffToken: string,
  registerNumber: RegisterNumber
): Promise<RegisterSessionDto | null> {
  const api = client(device, staffToken);
  const response = (await api.request('/register-sessions/active', 'get', {
    query: { registerNumber },
  })) as RegisterSessionNullableResponse | undefined;
  if (!response) {
    throw new Error('No register session response returned.');
  }
  return response.session ?? null;
}

export async function openRegisterSession(
  device: DeviceAuth,
  staffToken: string,
  registerNumber: RegisterNumber
): Promise<RegisterSessionDto> {
  const api = client(device, staffToken);
  const response = (await api.request('/register-sessions/open', 'post', {
    body: { registerNumber },
  })) as RegisterSessionDto | undefined;
  if (!response) {
    throw new Error('No register session response returned.');
  }
  return response;
}

export async function searchCustomers(
  device: DeviceAuth,
  staffToken: string,
  query: string
): Promise<CustomerListResponse> {
  const api = client(device, staffToken);
  const response = (await api.request('/customers', 'get', {
    query: { query },
  })) as CustomerListResponse | undefined;
  if (!response) {
    throw new Error('No customer search response returned.');
  }
  return response;
}
