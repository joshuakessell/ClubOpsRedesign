export type CustomerDto = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

export type CustomerListResponseDto = {
  items: CustomerDto[];
};
