"use client";

import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd").replace(/\/+$/, "");

type Enrollment = { productType?: string; productId?: string; slug?: string | null };

const TTL = 120_000;
let cache: { at: number; data: Enrollment[] } | null = null;
let inflight: Promise<Enrollment[]> | null = null;

function load(): Promise<Enrollment[]> {
  if (cache && Date.now() - cache.at < TTL) return Promise.resolve(cache.data);
  if (inflight) return inflight;
  if (typeof window === "undefined") return Promise.resolve([]);
  const token = localStorage.getItem("shohoz_token");
  if (!token) return Promise.resolve([]);
  inflight = fetch(`${API_URL}/api/users/me/enrollments`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? r.json() : []))
    .then((raw) => {
      const list = (Array.isArray(raw) ? raw : []) as Enrollment[];
      cache = { at: Date.now(), data: list };
      return list;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Client-side ownership check so product pages can stay static (ISR). */
export function useOwned(type: "course" | "book" | "exam", productId?: string, slug?: string) {
  const [owned, setOwned] = useState(false);
  useEffect(() => {
    let alive = true;
    load().then((list) => {
      if (!alive) return;
      setOwned(
        list.some(
          (e) =>
            e.productType === type &&
            ((!!productId && e.productId === productId) || (!!slug && e.slug === slug)),
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, [type, productId, slug]);
  return owned;
}
