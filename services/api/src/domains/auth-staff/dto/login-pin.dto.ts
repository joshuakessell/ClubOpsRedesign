export type StaffLoginRequestDto = {
  identifier: string;
  pin: string;
};

export type StaffLoginResponseDto = {
  session: StaffSessionDto;
  sessionToken: string;
};

export type StaffSessionDto = {
  staffId: string;
  role: 'staff' | 'admin';
  deviceId: string;
  createdAt: string;
  expiresAt: string;
};
