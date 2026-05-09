import { env } from '@/config/env';
import { session } from '@/lib/auth/session';
import type { ApiEnvelope } from '@/lib/api/types';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}



const withTimeout = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), env.apiTimeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
};

const buildUrl = (
  path: string,
  query?: Record<string, string | number | undefined | null>,
) => {
  const url = new URL(path, env.apiUrl);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const buildHeaders = (
  method: string,
  headers?: HeadersInit,
  body?: unknown,
  critical?: boolean,
): HeadersInit => {
  const normalizedMethod = method.toUpperCase();
  const hasBody = body !== undefined;
  const nextHeaders: Record<string, string> = {};

  if (hasBody) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  // Token JWT — necesario cuando los endpoints de recepción se protejan
  const token = session.getToken();
  if (token) {
    nextHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (critical) {
    nextHeaders['Idempotency-Key'] = crypto.randomUUID();
  }

  if (headers) {
    const customHeaders = new Headers(headers);
    customHeaders.forEach((value, key) => {
      nextHeaders[key] = value;
    });
  }

  if (normalizedMethod === 'GET' && !hasBody) {
    delete nextHeaders['Content-Type'];
  }

  return nextHeaders;
};

async function request<T>(
  method: string,
  path: string,
  options?: {
    query?: Record<string, string | number | undefined | null>;
    body?: unknown;
    headers?: HeadersInit;
    critical?: boolean;
  },
): Promise<ApiEnvelope<T>> {
  const response = await withTimeout(buildUrl(path, options?.query), {
    method,
    headers: buildHeaders(method, options?.headers, options?.body, options?.critical),
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  let payload: ApiEnvelope<T> | null = null;
  let rawText = '';

  if (contentType.includes('application/json')) {
    try {
      payload = (await response.json()) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  } else {
    rawText = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || rawText || `La API devolvio ${response.status} ${response.statusText}.`,
      response.status,
      payload?.code,
      payload ?? rawText,
    );
  }

  if (!payload) {
    throw new ApiError('La API no devolvio JSON valido.', response.status, undefined, rawText);
  }

  if (!payload.ok) {
    throw new ApiError(
      payload.message || 'La operacion no pudo completarse.',
      response.status,
      payload.code,
      payload,
    );
  }

  return payload;
}

export const apiClient = {
  get: <T>(
    path: string,
    query?: Record<string, string | number | undefined | null>,
  ) => request<T>('GET', path, { query }),

  post: <T>(
    path: string,
    body?: unknown,
    critical = false,
  ) => request<T>('POST', path, { body, critical }),

  patch: <T>(
  path: string,
  body?: unknown,
  critical = false,
) => request<T>('PATCH', path, { body, critical }),
};