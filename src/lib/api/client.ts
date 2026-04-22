import { env } from '@/config/env';
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
  const timeout = setTimeout(() => controller.abort(), env.apiTimeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }
};

const buildUrl = (path: string, query?: Record<string, string | number | undefined | null>) => {
  const url = new URL(path, env.apiUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const createCriticalHeaders = (headers?: HeadersInit): HeadersInit => ({
  'Content-Type': 'application/json',
  'Idempotency-Key': crypto.randomUUID(),
  ...(headers ?? {}),
});

async function request<T>(method: string, path: string, options?: {
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  headers?: HeadersInit;
  critical?: boolean;
}): Promise<ApiEnvelope<T>> {
  const response = await withTimeout(buildUrl(path, options?.query), {
    method,
    headers: options?.critical ? createCriticalHeaders(options?.headers) : {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new ApiError('La API devolvio una respuesta no valida.', response.status);
    }
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      payload?.message ?? 'La operacion no pudo completarse.',
      response.status,
      payload?.code,
      payload,
    );
  }

  if (!payload) {
    throw new ApiError('La API no devolvio contenido.', response.status);
  }

  return payload;
}

export const apiClient = {
  get: <T>(path: string, query?: Record<string, string | number | undefined | null>) =>
    request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, critical = false) =>
    request<T>('POST', path, { body, critical }),
};
