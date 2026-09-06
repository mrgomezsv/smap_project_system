/**
 * Cliente HTTP para la API NestJS.
 *
 * - API_BASE_URL: configurable vía NEXT_PUBLIC_API_URL (default http://localhost:3001)
 * - Pasa automáticamente el Bearer token de Firebase si existe
 * - Devuelve errores tipados con código HTTP
 * - Soporta auto-refresh del token vía función `getToken` (usada por componentes
 *   envueltos en AuthProvider)
 */

const isServer = typeof window === 'undefined';

const API_BASE_URL = isServer
  ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001');

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
  /**
   * Si se pasa, se usa para obtener el token más reciente.
   * Útil cuando hay un AuthProvider que mantiene la sesión activa
   * y se quiere auto-refresh del token.
   */
  getToken?: () => Promise<string | null>;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number };
  signal?: AbortSignal;
  timeoutMs?: number;
};

type DownloadOptions = Omit<RequestOptions, 'method' | 'body'>;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    getToken,
    headers = {},
    cache,
    next,
    signal: externalSignal,
    timeoutMs = 8_000,
  } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  // Resolver token: prioridad token explícito > getToken() > null
  const finalToken = token ?? (getToken ? await getToken() : null);
  if (finalToken) {
    finalHeaders.Authorization = `Bearer ${finalToken}`;
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      cache: cache ?? 'no-store',
      next,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const data = isJson ? await res.json() : await res.text();
    let message: string;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      if (obj.message) {
        message = Array.isArray(obj.message) ? obj.message.join(', ') : String(obj.message);
      } else if (obj.error) {
        if (typeof obj.error === 'object' && obj.error !== null && obj.error.message) {
          message = Array.isArray(obj.error.message)
            ? obj.error.message.join(', ')
            : String(obj.error.message);
        } else if (typeof obj.error === 'string') {
          message = obj.error;
        } else {
          message = `HTTP ${res.status}`;
        }
      } else {
        message = `HTTP ${res.status}`;
      }
    } else if (typeof data === 'string' && data.trim().startsWith('<')) {
      message = `Error del servidor (${res.status} ${res.statusText || 'Bad Gateway'})`;
    } else {
      message = typeof data === 'string' ? data : `HTTP ${res.status}`;
    }
    throw new ApiError(message, res.status, data);
  }

  if (res.status === 204 || !isJson) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

async function download(path: string, options: DownloadOptions = {}): Promise<Blob> {
  const {
    token,
    getToken,
    headers = {},
    cache,
    signal: externalSignal,
    timeoutMs = 30_000,
  } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  const finalToken = token ?? (getToken ? await getToken() : null);
  if (finalToken) finalHeaders.Authorization = `Bearer ${finalToken}`;

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: finalHeaders,
      cache: cache ?? 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
  }

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    let errorMsg: string;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      if (obj.message) {
        errorMsg = Array.isArray(obj.message) ? obj.message.join(', ') : String(obj.message);
      } else if (obj.error) {
        if (typeof obj.error === 'object' && obj.error !== null && obj.error.message) {
          errorMsg = Array.isArray(obj.error.message)
            ? obj.error.message.join(', ')
            : String(obj.error.message);
        } else if (typeof obj.error === 'string') {
          errorMsg = obj.error;
        } else {
          errorMsg = `HTTP ${res.status}`;
        }
      } else {
        errorMsg = `HTTP ${res.status}`;
      }
    } else {
      errorMsg = typeof data === 'string' ? data : `HTTP ${res.status}`;
    }
    throw new ApiError(errorMsg, res.status, data);
  }

  return res.blob();
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  download: (path: string, options?: DownloadOptions) => download(path, options),
  blob: (path: string, options?: DownloadOptions) => download(path, options),
};

export { API_BASE_URL, PUBLIC_API_URL };
