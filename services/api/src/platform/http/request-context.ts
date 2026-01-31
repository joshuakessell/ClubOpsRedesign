export type DeviceContext = {
  id: string;
  name: string;
  kind: 'register' | 'kiosk' | 'office';
  enabled: boolean;
};

export type StaffSessionContext = {
  staffId: string;
  role: 'staff' | 'admin';
  deviceId: string;
  sessionId: string;
};

export type RequestContext = {
  device?: DeviceContext;
  staffSession?: StaffSessionContext;
};
