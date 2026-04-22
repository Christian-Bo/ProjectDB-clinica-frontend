const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://projectdb-clinica-production.up.railway.app',
  apiTimeoutMs: toNumber(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 15000),
};
