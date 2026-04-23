'use client';

import { ToastProvider } from '@/shared/components/providers/ToastProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
