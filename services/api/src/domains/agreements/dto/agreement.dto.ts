export type AgreementStatus = 'SIGNED' | 'BYPASSED';
export type AgreementMethod = 'KIOSK' | 'REGISTER' | 'ADMIN';

export type AgreementDto = {
  id: string;
  visitId: string;
  status: AgreementStatus;
  capturedAt: string;
  method: AgreementMethod;
  metadata: Record<string, unknown>;
};
