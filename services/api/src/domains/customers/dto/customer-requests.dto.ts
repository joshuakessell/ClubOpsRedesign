export type CreateCustomerRequestDto = {
  firstName: string;
  lastName: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
};
