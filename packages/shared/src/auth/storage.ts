export type DeviceAuth = {
  deviceId: string;
  deviceToken: string;
};

const DEVICE_ID_KEY = 'clubops_device_id';
const DEVICE_TOKEN_KEY = 'clubops_device_token';
const STAFF_TOKEN_KEY = 'clubops_staff_token';

export function loadDeviceAuth(): DeviceAuth | null {
  if (typeof window === 'undefined') return null;
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY) ?? '';
  const deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY) ?? '';
  if (!deviceId || !deviceToken) return null;
  return { deviceId, deviceToken };
}

export function saveDeviceAuth(auth: DeviceAuth) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEVICE_ID_KEY, auth.deviceId);
  window.localStorage.setItem(DEVICE_TOKEN_KEY, auth.deviceToken);
}

export function clearDeviceAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEVICE_ID_KEY);
  window.localStorage.removeItem(DEVICE_TOKEN_KEY);
}

export function loadStaffToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STAFF_TOKEN_KEY);
}

export function saveStaffToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STAFF_TOKEN_KEY, token);
}

export function clearStaffToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STAFF_TOKEN_KEY);
}
