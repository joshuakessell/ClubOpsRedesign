import type { paths } from './openapi';

export type ApiClientConfig = {
  baseUrl: string;
  deviceId?: string;
  deviceToken?: string;
  staffToken?: string;
  fetcher?: typeof fetch;
};

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type PathKey = keyof paths;
type MethodKey<P extends PathKey> = Extract<keyof paths[P], HttpMethod>;

type RequestBody<P extends PathKey, M extends MethodKey<P>> =
  paths[P][M] extends { requestBody: { content: { 'application/json': infer Body } } }
    ? Body
    : undefined;

type QueryParams<P extends PathKey, M extends MethodKey<P>> =
  paths[P][M] extends { parameters: { query?: infer Params } } ? Params : undefined;

type PathParams<P extends PathKey, M extends MethodKey<P>> =
  paths[P][M] extends { parameters: { path?: infer Params } } ? Params : undefined;

type ResponseForStatus<ResponseMap, Status extends string> =
  ResponseMap extends Record<string, any>
    ? Status extends keyof ResponseMap
      ? ResponseMap[Status] extends { content: { 'application/json': infer Body } }
        ? Body
        : undefined
      : undefined
    : undefined;

type ResponseBody<P extends PathKey, M extends MethodKey<P>> =
  paths[P][M] extends { responses: infer Responses }
    ? ResponseForStatus<Responses, '200'> | ResponseForStatus<Responses, '201'> | ResponseForStatus<Responses, '204'>
    : undefined;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private baseUrl: string;
  private deviceId?: string;
  private deviceToken?: string;
  private staffToken?: string;
  private fetcher: typeof fetch;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.deviceId = config.deviceId;
    this.deviceToken = config.deviceToken;
    this.staffToken = config.staffToken;
    this.fetcher = config.fetcher ?? fetch;
  }

  setDevice(deviceId: string | undefined, deviceToken: string | undefined) {
    this.deviceId = deviceId;
    this.deviceToken = deviceToken;
  }

  setStaffToken(staffToken: string | undefined) {
    this.staffToken = staffToken;
  }

  async request<P extends PathKey, M extends MethodKey<P>>(
    path: P,
    method: M,
    options?: {
      body?: RequestBody<P, M>;
      query?: QueryParams<P, M>;
      pathParams?: PathParams<P, M>;
      headers?: Record<string, string>;
    }
  ): Promise<ResponseBody<P, M>> {
    let resolvedPath = String(path);
    if (options?.pathParams) {
      for (const [key, value] of Object.entries(options.pathParams)) {
        resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(String(value)));
      }
    }

    const url = new URL(`${this.baseUrl}${resolvedPath}`);
    if (options?.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            params.append(key, String(item));
          }
        } else {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url.search = queryString;
      }
    }

    const headers: Record<string, string> = {
      ...(options?.headers ?? {}),
    };

    if (this.deviceId) headers['x-device-id'] = this.deviceId;
    if (this.deviceToken) headers['x-device-token'] = this.deviceToken;
    if (this.staffToken) headers.Authorization = `Bearer ${this.staffToken}`;

    if (options?.body) {
      headers['content-type'] = 'application/json';
    }

    const response = await this.fetcher(url.toString(), {
      method: method.toUpperCase(),
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 204) {
      return undefined as ResponseBody<P, M>;
    }

    const text = await response.text();
    const body = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      throw new ApiError(`Request failed with ${response.status}`, response.status, body);
    }

    return body as ResponseBody<P, M>;
  }

  health() {
    return this.request('/health', 'get');
  }
}

export function createApiClient(config: ApiClientConfig) {
  return new ApiClient(config);
}
