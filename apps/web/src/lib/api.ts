/**
 * Cliente HTTP para la API NestJS.
 *
 * - API_BASE_URL: configurable vía NEXT_PUBLIC_API_URL (default http://localhost:3001)
 * - Pasa automáticamente el Bearer token de Firebase si existe
 * - Devuelve errores tipados con código HTTP
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number };
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {}, cache, next } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    cache: cache ?? 'no-store',
    next,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const data = isJson ? await res.json() : await res.text();
    const message =
      (isJson && (data as any)?.message) ||
      (typeof data === 'string' ? data : `HTTP ${res.status}`);
    const errorMsg = Array.isArray(message) ? message.join(', ') : String(message);
    throw new ApiError(errorMsg, res.status, data);
  }

  if (res.status === 204 || !isJson) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export { API_BASE_URL };
