import { env } from '@/config/env';
import { session } from '@/lib/auth/session';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  critical = false,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = session.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (critical) {
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const raw = await response.json() as Record<string, unknown>;

  const payload: ApiResponse<T> = {
    success: Boolean(raw.ok ?? raw.success),
    message: (raw.message as string) ?? '',
    data: raw.data as T | undefined,
    errorCode: (raw.code as string) ?? (raw.errorCode as string) ?? undefined,
  };

  return payload;
}

export const patientsApi = {
  get:   <T>(path: string) =>
    request<T>('GET', path),
  post:  <T>(path: string, body?: unknown, critical = false) =>
    request<T>('POST', path, body, critical),
  put:   <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) =>
    request<T>('PATCH', path, body),
};