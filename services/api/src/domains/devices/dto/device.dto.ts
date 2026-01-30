export type DeviceKind = 'register' | 'kiosk' | 'office';

export type DeviceDto = {
  id: string;
  name: string;
  kind: DeviceKind;
  enabled: boolean;
  lastSeenAt: string | null;
};

export type CreateDeviceRequestDto = {
  name: string;
  kind: DeviceKind;
  enabled?: boolean;
};

export type UpdateDeviceRequestDto = {
  name?: string;
  kind?: DeviceKind;
  enabled?: boolean;
};

export type ProvisionDeviceResponseDto = {
  device: DeviceDto;
  deviceToken: string;
};
