'use client';

import { useEffect, useMemo, useState } from 'react';
import { env } from '@/config/env';
import { receptionApi } from '@/lib/api/reception';
import type { QueueDisplayResponse } from '@/lib/api/types';

const normalizeQueue = (value: QueueDisplayResponse | null | undefined): QueueDisplayResponse | null => {
  if (!value) {
    return null;
  }

  return {
    ...value,
    proximos: Array.isArray(value.proximos) ? value.proximos : [],
    servicioIds: Array.isArray(value.servicioIds) ? value.servicioIds : [],
    ticketsLlamados: Array.isArray(value.ticketsLlamados) ? value.ticketsLlamados : [],
    ultimosLlamados: Array.isArray(value.ultimosLlamados) ? value.ultimosLlamados : [],
  };
};

const normalizeIds = (servicioId?: number, servicioIds?: number[]) => {
  const values = [...(servicioIds ?? []), ...(servicioId ? [servicioId] : [])]
    .filter((value): value is number => Number.isFinite(value) && value > 0);

  return Array.from(new Set(values)).sort((a, b) => a - b);
};

export function useQueueDisplay(
  sedeId?: number,
  servicioId?: number,
  enableRealtime = true,
  servicioIds?: number[],
) {
  const [queue, setQueue] = useState<QueueDisplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedServicioIds = useMemo(
    () => normalizeIds(servicioId, servicioIds),
    [servicioId, servicioIds],
  );

  const serviciosKey = resolvedServicioIds.join(',');
  const primaryServicioId = resolvedServicioIds[0];

  useEffect(() => {
    if (!sedeId || resolvedServicioIds.length === 0 || !primaryServicioId) {
      setQueue(null);
      setError(null);
      return;
    }

    let disposed = false;
    let eventSource: EventSource | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await receptionApi.getPantallaCola(sedeId, primaryServicioId, resolvedServicioIds);

        if (!disposed) {
          setQueue(normalizeQueue(response.data));
          setError(null);
        }
      } catch (err) {
        if (!disposed) {
          setQueue(null);
          setError(err instanceof Error ? err.message : 'No fue posible consultar la cola.');
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void load();

    if (enableRealtime && typeof window !== 'undefined') {
      const url = new URL('/api/pantalla/cola/stream', env.apiUrl);
      url.searchParams.set('sedeId', String(sedeId));
      url.searchParams.set('servicioId', String(primaryServicioId));
      url.searchParams.set('servicioIds', serviciosKey);
      url.searchParams.set('intervalSeconds', '4');

      try {
        eventSource = new EventSource(url.toString());

        eventSource.addEventListener('cola', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data);
            if (payload?.data) {
              setQueue(normalizeQueue(payload.data as QueueDisplayResponse));
              setError(null);
            }
          } catch {
          }
        });

        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
        };
      } catch {
        eventSource = null;
      }
    }

    intervalId = setInterval(() => {
      void load();
    }, 15000);

    return () => {
      disposed = true;
      eventSource?.close();

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enableRealtime, sedeId, primaryServicioId, serviciosKey]);

  return useMemo(
    () => ({
      queue,
      isLoading,
      error,
    }),
    [queue, isLoading, error],
  );
}
