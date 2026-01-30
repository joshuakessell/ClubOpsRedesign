export type StaffRole = 'staff' | 'admin';

export type StaffListItemDto = {
  id: string;
  identifier: string;
  name: string;
  role: StaffRole;
};
