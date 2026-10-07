"use client";

import { useState } from "react";
import { formatBdt, formatDate } from "@/lib/format";
import type { TrackedOrder } from "@/lib/types";
import { IconArrowRight, IconSearch } from "@/components/ui/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "পেন্ডিং", className: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400" },
  PAID: { label: "পরিশোধিত", className: "border-success/40 bg-success/10 text-success" },
  FAILED: { label: "ব্যর্থ", className: "border-danger/40 bg-danger/10 text-danger" },
  CANCELLED: { label: "বাতিল", className: "border-danger/40 bg-danger/10 text-danger" },
  REFUNDED: { label: "ফেরত", className: "border-sky-400/40 bg-sky-400/10 text-sky-600 dark:text-sky-400" },
};

type Mode = "idle" | "loading" | "done" | "error" | "empty";

export function TrackOrder() {
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [mode, setMode] = useState<Mode>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setMode("loading");
    try {
      const res = await fetch(`${API_URL}/api/orders/track?q=${encodeURIComponent(term)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { orders?: TrackedOrder[] };
      const list = Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
      setMode(list.length ? "done" : "empty");
    } catch {
      setMode("error");
    }
  }

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Order Tracking</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-foreground sm:text-2xl">আপনার অর্ডার ট্র্যাক করুন</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                মোবাইল নম্বর, ইমেইল অথবা অর্ডার নম্বর দিয়ে আপনার অর্ডারের সর্বশেষ অবস্থা দেখুন।
              </p>
            </div>
            <form onSubmit={submit} className="flex w-full max-w-md gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="অর্ডার নম্বর / মোবাইল / ইমেইল"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent"
              />
              <button
                type="submit"
                disabled={mode === "loading" || !q.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                <IconSearch width={16} height={16} />
                <span className="hidden sm:inline">ট্র্যাক</span>
              </button>
            </form>
          </div>

          {mode === "loading" && <p className="mt-5 text-sm text-muted-foreground">খোঁজা হচ্ছে…</p>}
          {mode === "error" && <p className="mt-5 text-sm text-danger">দুঃখিত, তথ্য আনা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।</p>}
          {mode === "empty" && <p className="mt-5 text-sm text-muted-foreground">এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি। নম্বর/ইমেইল ঠিক আছে কিনা দেখুন।</p>}

          {mode === "done" && (
            <div className="mt-6 space-y-3">
              {orders.map((o) => {
                const meta = STATUS_META[o.status] ?? { label: o.status, className: "border-border bg-muted/40 text-muted-foreground" };
                return (
                  <div key={o.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">#{o.orderNumber ?? "—"}</p>
                        <p className="mt-0.5 truncate font-display text-sm font-extrabold text-foreground">{o.productTitle}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                        <span className="font-display text-base font-extrabold text-foreground">{formatBdt(o.total)}</span>
                      </div>
                    </div>
                    {o.isPhysical && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>কুরিয়ার: <span className="font-semibold text-foreground">{o.courierStatus || "প্রস্তুতি চলছে"}</span></span>
                        {o.trackingCode && <span>ট্র্যাকিং কোড: <span className="font-mono font-semibold text-foreground">{o.trackingCode}</span></span>}
                      </div>
                    )}
                    <a
                      href={`/checkout/success?orderId=${o.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                    >
                      বিস্তারিত দেখুন <IconArrowRight width={13} height={13} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
