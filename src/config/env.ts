const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeBaseUrl = (value: string | undefined): string => {
  const raw = (value ?? 'http://localhost:8080').trim();
  return raw.replace(/\/+$/, '');
};

export const env = {
  apiUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  apiTimeoutMs: toPositiveNumber(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 15000),
};
