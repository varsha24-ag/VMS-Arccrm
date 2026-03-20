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
  timeoutMs: number;
}

type ToastInput = Omit<ToastItem, "id" | "timeoutMs">;

interface ToastContextValue {
  pushToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (variant === "error") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-500">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M12 8h.01M11 12h1v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = toast.durationMs ?? (toast.actionLabel ? 8000 : 3500);
    setToasts((prev) => [...prev, { ...toast, id, timeoutMs: duration }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <style jsx>{`
        @keyframes toast-progress-shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
      <div className="pointer-events-none fixed right-6 top-6 z-[999] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-[340px] overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)] backdrop-blur"
          >
            <div className="flex gap-3 px-4 py-3">
              <ToastIcon variant={toast.variant} />
              <div className="text-[15px] text-[var(--text-2)]">
                <p className="font-semibold text-[var(--text-1)]">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-[var(--text-3)]">{toast.description}</p> : null}
                {toast.actionLabel && toast.onAction ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.();
                    }}
                    className="mt-2 rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)]"
                  >
                    {toast.actionLabel}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="h-1 w-full bg-[var(--surface-2)]">
              <div
                className={`h-full origin-left ${
                  toast.variant === "success"
                    ? "bg-emerald-500"
                    : toast.variant === "error"
                    ? "bg-rose-500"
                    : "bg-sky-500"
                }`}
                style={{
                  animationName: "toast-progress-shrink",
                  animationDuration: `${toast.timeoutMs}ms`,
                  animationTimingFunction: "linear",
                  animationFillMode: "forwards",
                }}
              />
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
