"use client";

import { useCallback, useEffect, useState } from "react";
import * as api from "@/lib/admin-api";
import { useAdminTitle } from "@/lib/use-admin-title";
import { useToast } from "./admin-toast";

export function BlockedPage() {
  useAdminTitle("Blocked Customers");
  const toast = useToast();
  const [rows, setRows] = useState<api.BlockedContact[]>([]);
  const [type, setType] = useState<"PHONE" | "IP">("PHONE");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api.listBlocked());
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function add() {
    if (!value.trim()) {
      toast.error("Phone/IP din.");
      return;
    }
    setBusy(true);
    try {
      await api.addBlocked({ type, value: value.trim(), reason: reason.trim() || undefined });
      toast.success("Blocked");
      setValue("");
      setReason("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Block failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.removeBlocked(id);
      toast.success("Unblocked");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unblock failed");
    }
  }

  const inputCls = "rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-extrabold text-foreground">Blocked Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">Blocked phone number ba IP theke kono order accept hobe na.</p>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as "PHONE" | "IP")} className={inputCls}>
            <option value="PHONE">Phone</option>
            <option value="IP">IP</option>
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PHONE" ? "01XXXXXXXXX / +88..." : "IP address"} className={`${inputCls} min-w-[220px] flex-1`} />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className={`${inputCls} min-w-[160px]`} />
          <button type="button" onClick={add} disabled={busy} className="rounded-xl bg-danger px-5 py-2.5 text-sm font-bold text-danger-foreground hover:opacity-90 disabled:opacity-50">Block</button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Kono blocked entry nei.</div>
        ) : (
          rows.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${b.type === "PHONE" ? "bg-accent/15 text-accent" : "bg-sky/10 text-sky"}`}>{b.type}</span>
                  <span className="font-mono text-sm font-bold text-foreground">{b.value}</span>
                </div>
                {b.reason && <p className="mt-1 text-xs text-muted-foreground">{b.reason}</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(b.createdAt).toLocaleString("en-BD")}</p>
              </div>
              <button type="button" onClick={() => remove(b.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">Unblock</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
