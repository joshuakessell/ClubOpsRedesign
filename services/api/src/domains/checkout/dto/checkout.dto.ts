export type CheckoutMethod = 'KIOSK' | 'REGISTER' | 'ADMIN';

export type CheckoutEventDto = {
  id: string;
  visitId: string;
  requestedAt: string;
  completedAt: string | null;
  method: CheckoutMethod;
};
