import type { AgreementMethod, AgreementStatus } from './agreement.dto';

export type CaptureAgreementRequestDto = {
  status: AgreementStatus;
  method: AgreementMethod;
  metadata?: Record<string, unknown>;
};
