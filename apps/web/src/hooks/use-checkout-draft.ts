"use client";

import { useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

/**
 * Periodically saves the in-progress checkout form as an "incomplete order"
 * so the admin can see customers who filled the form but never submitted.
 * Returns a ref holding the draft id (to delete it after a successful order).
 */
export function useCheckoutDraft(enabled: boolean, payload: () => Record<string, unknown>) {
  const idRef = useRef<string | null>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  useEffect(() => {
    if (!enabled) return;

    const current = () => {
      const body = payloadRef.current();
      const hasData = Boolean(String(body.phone ?? "").trim() || String(body.name ?? "").trim());
      return hasData ? { id: idRef.current, ...body } : null;
    };

    const save = async () => {
      const body = current();
      if (!body) return;
      try {
        const res = await fetch(`${API_URL}/api/orders/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string };
          if (data?.id) idRef.current = data.id;
        }
      } catch {
        /* ignore */
      }
    };

    const onHide = () => {
      const body = current();
      if (!body) return;
      try {
        navigator.sendBeacon(`${API_URL}/api/orders/draft`, new Blob([JSON.stringify(body)], { type: "application/json" }));
      } catch {
        /* ignore */
      }
    };

    const t = setInterval(save, 5000);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [enabled]);

  return idRef;
}
