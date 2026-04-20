const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
};

export const env = {
  apiUrl: required(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL'),
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000),
};