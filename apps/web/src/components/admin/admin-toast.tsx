"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheckCircle, IconCircleX, IconX } from "@/components/ui/icons";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };

export type ToastApi = { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void };

const ToastCtx = createContext<ToastApi>({ success: () => {}, error: () => {}, info: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const toast = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-pop backdrop-blur",
              t.type === "success" && "border-success/30 bg-card",
              t.type === "error" && "border-danger/30 bg-card",
              t.type === "info" && "border-border bg-card",
            )}
          >
            {t.type === "success" && <IconCheckCircle width={18} height={18} className="mt-0.5 shrink-0 text-success" />}
            {t.type === "error" && <IconCircleX width={18} height={18} className="mt-0.5 shrink-0 text-danger" />}
            {t.type === "info" && <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
            <p className="flex-1 text-sm text-foreground">{t.message}</p>
            <button type="button" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
              <IconX width={14} height={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
