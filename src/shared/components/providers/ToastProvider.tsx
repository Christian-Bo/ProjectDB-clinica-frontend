'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'warning' | 'error' | 'info';

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextType = {
  notify: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const toastClassByType: Record<ToastType, string> = {
  success: 'toast toast-success',
  warning: 'toast toast-warning',
  error: 'toast toast-error',
  info: 'toast toast-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => remove(id), 4200);
  }, [remove]);

  const value = useMemo<ToastContextType>(() => ({
    notify,
    success: (title, description) => notify({ title, description, type: 'success' }),
    warning: (title, description) => notify({ title, description, type: 'warning' }),
    error: (title, description) => notify({ title, description, type: 'error' }),
    info: (title, description) => notify({ title, description, type: 'info' }),
  }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {items.map((item) => (
          <div key={item.id} className={toastClassByType[item.type]}>
            <div className="toast-title-row">
              <strong>{item.title}</strong>
              <button className="toast-close" onClick={() => remove(item.id)} aria-label="Cerrar notificacion">
                ×
              </button>
            </div>
            {item.description ? <p>{item.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider.');
  }
  return context;
}
