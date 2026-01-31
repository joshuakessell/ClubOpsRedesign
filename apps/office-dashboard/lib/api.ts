import { createApiClient, type components, type DeviceAuth } from '@clubops/shared';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1';

export type InventoryListResponse = components['schemas']['InventoryListResponse'];
export type InventoryItemType = components['schemas']['InventoryItemType'];
export type InventoryStatus = components['schemas']['InventoryStatus'];
export type WaitlistListResponse = components['schemas']['WaitlistListResponse'];
export type WaitlistStatus = components['schemas']['WaitlistStatus'];
export type DeviceListResponse = components['schemas']['DeviceListResponse'];

function client(device: DeviceAuth, staffToken: string) {
  return createApiClient({
    baseUrl,
    deviceId: device.deviceId,
    deviceToken: device.deviceToken,
    staffToken,
  });
}

export async function fetchInventory(
  device: DeviceAuth,
  staffToken: string,
  filters: { type?: InventoryItemType; status?: InventoryStatus }
): Promise<InventoryListResponse> {
  const api = client(device, staffToken);
  const response = (await api.request('/inventory/items', 'get', {
    query: filters,
  })) as InventoryListResponse | undefined;
  if (!response) {
    throw new Error('No inventory response returned.');
  }
  return response;
}

export async function fetchWaitlist(
  device: DeviceAuth,
  staffToken: string,
  status?: WaitlistStatus
): Promise<WaitlistListResponse> {
  const api = client(device, staffToken);
  const response = (await api.request('/waitlist', 'get', {
    query: status ? { status } : {},
  })) as WaitlistListResponse | undefined;
  if (!response) {
    throw new Error('No waitlist response returned.');
  }
  return response;
}

export async function fetchAdminDevices(
  device: DeviceAuth,
  staffToken: string
): Promise<DeviceListResponse> {
  const api = client(device, staffToken);
  const response = (await api.request('/admin/devices', 'get')) as DeviceListResponse | undefined;
  if (!response) {
    throw new Error('No device list response returned.');
  }
  return response;
}
