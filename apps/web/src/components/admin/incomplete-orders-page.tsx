"use client";

import { useCallback, useEffect, useState } from "react";
import * as api from "@/lib/admin-api";
import { useAdminTitle } from "@/lib/use-admin-title";
import { useToast } from "./admin-toast";

function itemsSummary(items: unknown): string {
  if (!Array.isArray(items) || !items.length) return "—";
  return items
    .map((i) => `${(i as { title?: string }).title ?? (i as { productId?: string }).productId ?? "item"} ×${(i as { quantity?: number }).quantity ?? 1}`)
    .join(", ");
}

export function IncompleteOrdersPage() {
  useAdminTitle("Incomplete Orders");
  const toast = useToast();
  const [rows, setRows] = useState<api.CheckoutDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await api.listDrafts());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("এই incomplete order ta delete korben?")) return;
    try {
      await api.deleteDraft(id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Incomplete Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">যারা form fill up করেছিল কিন্তু order submit করেনি (30s por por auto refresh)।</p>
        </div>
        <button type="button" onClick={load} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted">Refresh</button>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Phone</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Items</th>
                <th className="px-4 py-3 font-bold">Address</th>
                <th className="px-4 py-3 font-bold">Device</th>
                <th className="px-4 py-3 font-bold">IP</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(d.updatedAt).toLocaleString("en-BD")}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{d.name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.phone || "—"}</td>
                  <td className="max-w-[18ch] truncate px-4 py-3 text-xs text-muted-foreground">{d.email || "—"}</td>
                  <td className="max-w-[26ch] truncate px-4 py-3 text-xs text-muted-foreground">{itemsSummary(d.items)}</td>
                  <td className="max-w-[24ch] truncate px-4 py-3 text-xs text-muted-foreground">{d.address || "—"}{d.region ? ` (${d.region})` : ""}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.device || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.ipAddress || "—"}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => remove(d.id)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger/10">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Kono incomplete order nei.</p>
        ) : null}
      </div>
    </div>
  );
}
