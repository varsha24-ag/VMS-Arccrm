"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (variant === "error") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-200">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M12 8h.01M11 12h1v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    const duration = toast.durationMs ?? (toast.actionLabel ? 8000 : 3500);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-6 top-6 z-[999] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-[340px] gap-3 rounded-2xl border border-white/15 bg-[#0b2239]/90 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            <ToastIcon variant={toast.variant} />
            <div className="text-[15px] text-slate-200">
              <p className="font-semibold text-white">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm text-slate-300">{toast.description}</p> : null}
              {toast.actionLabel && toast.onAction ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                  }}
                  className="mt-2 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-100 hover:bg-white/10"
                >
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
