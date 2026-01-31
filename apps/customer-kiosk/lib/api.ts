import { createApiClient, type components, type DeviceAuth } from '@clubops/shared';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1';

export type CheckoutEventDto = components['schemas']['CheckoutEventDTO'];
export type VisitNullableResponse = components['schemas']['VisitNullableResponse'];
export type AgreementDto = components['schemas']['AgreementDTO'];

function client(device: DeviceAuth, staffToken: string) {
  return createApiClient({
    baseUrl,
    deviceId: device.deviceId,
    deviceToken: device.deviceToken,
    staffToken,
  });
}

export async function requestCheckout(
  device: DeviceAuth,
  staffToken: string,
  visitId: string
): Promise<CheckoutEventDto> {
  const api = client(device, staffToken);
  const response = (await api.request('/checkout/{visitId}/request', 'post', {
    pathParams: { visitId },
    body: { method: 'KIOSK' },
  })) as CheckoutEventDto | undefined;
  if (!response) {
    throw new Error('No checkout response returned.');
  }
  return response;
}

export async function fetchActiveVisit(
  device: DeviceAuth,
  staffToken: string,
  customerId: string
): Promise<VisitNullableResponse> {
  const api = client(device, staffToken);
  const response = (await api.request('/visits/active', 'get', {
    query: { customerId },
  })) as VisitNullableResponse | undefined;
  if (!response) {
    throw new Error('No visit response returned.');
  }
  return response;
}

export async function captureAgreementBypass(
  device: DeviceAuth,
  staffToken: string,
  visitId: string
): Promise<AgreementDto> {
  const api = client(device, staffToken);
  const response = (await api.request('/agreements/{visitId}/capture', 'post', {
    pathParams: { visitId },
    body: { status: 'BYPASSED', method: 'KIOSK' },
  })) as AgreementDto | undefined;
  if (!response) {
    throw new Error('No agreement response returned.');
  }
  return response;
}

export async function captureAgreementSigned(
  device: DeviceAuth,
  staffToken: string,
  visitId: string,
  metadata: Record<string, string>
): Promise<AgreementDto> {
  const api = client(device, staffToken);
  const response = (await api.request('/agreements/{visitId}/capture', 'post', {
    pathParams: { visitId },
    body: { status: 'SIGNED', method: 'KIOSK', metadata },
  })) as AgreementDto | undefined;
  if (!response) {
    throw new Error('No agreement response returned.');
  }
  return response;
}
