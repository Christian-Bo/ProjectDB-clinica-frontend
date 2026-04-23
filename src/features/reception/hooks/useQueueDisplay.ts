'use client';

import { useEffect, useMemo, useState } from 'react';
import { env } from '@/config/env';
import { receptionApi } from '@/lib/api/reception';
import type { QueueDisplayResponse } from '@/lib/api/types';

export function useQueueDisplay(
  sedeId?: number,
  servicioId?: number,
  enableRealtime = true,
) {
  const [queue, setQueue] = useState<QueueDisplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sedeId || !servicioId) {
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
        const response = await receptionApi.getPantallaCola(sedeId, servicioId);

        if (!disposed) {
          setQueue(response.data);
          setError(null);
        }
      } catch (err) {
        if (!disposed) {
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
      url.searchParams.set('servicioId', String(servicioId));
      url.searchParams.set('intervalSeconds', '4');

      try {
        eventSource = new EventSource(url.toString());
        eventSource.addEventListener('cola', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data);
            if (payload?.data) {
              setQueue(payload.data as QueueDisplayResponse);
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
  }, [enableRealtime, sedeId, servicioId]);

  return useMemo(() => ({ queue, isLoading, error }), [queue, isLoading, error]);
}
