"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/admin-api";
import { useAdminTitle } from "@/lib/use-admin-title";
import { useToast } from "./admin-toast";
import { AdminModal, Badge } from "./admin-ui";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/format";

type Draft = {
  id?: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: number | "";
  minSubtotal: number | "";
  maxDiscount: number | "";
  appliesTo: string[];
  active: boolean;
  startsAt: string;
  expiresAt: string;
  usageLimit: number | "";
};

const EMPTY: Draft = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "",
  minSubtotal: "",
  maxDiscount: "",
  appliesTo: [],
  active: true,
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
};

const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function CouponsPage() {
  useAdminTitle("Coupons");
  const toast = useToast();
  const [items, setItems] = useState<api.Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api
      .listCoupons()
      .then(setItems)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(c: api.Coupon) {
    setDraft({
      id: c.id,
      code: c.code,
      description: c.description ?? "",
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal,
      maxDiscount: c.maxDiscount ?? "",
      appliesTo: c.appliesTo ?? [],
      active: c.active,
      startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      usageLimit: c.usageLimit ?? "",
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.code.trim()) {
      toast.error("Enter a coupon code.");
      return;
    }
    if (draft.value === "" || Number(draft.value) <= 0) {
      toast.error("Enter a discount value.");
      return;
    }
    if (draft.type === "PERCENT" && Number(draft.value) > 100) {
      toast.error("Percent cannot exceed 100.");
      return;
    }
    const dto: Record<string, unknown> = {
      code: draft.code.trim(),
      description: draft.description.trim() || undefined,
      type: draft.type,
      value: Number(draft.value),
      minSubtotal: draft.minSubtotal === "" ? 0 : Number(draft.minSubtotal),
      appliesTo: draft.appliesTo,
      active: draft.active,
    };
    if (draft.maxDiscount !== "") dto.maxDiscount = Number(draft.maxDiscount);
    if (draft.usageLimit !== "") dto.usageLimit = Number(draft.usageLimit);
    if (draft.startsAt) dto.startsAt = new Date(draft.startsAt).toISOString();
    if (draft.expiresAt) dto.expiresAt = new Date(draft.expiresAt).toISOString();

    setBusy(true);
    try {
      if (draft.id) await api.updateCoupon(draft.id, dto);
      else await api.createCoupon(dto);
      toast.success("Coupon saved");
      setDraft(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, code: string) {
    if (typeof window !== "undefined" && !window.confirm(`Delete coupon ${code}?`)) return;
    try {
      await api.deleteCoupon(id);
      toast.success("Coupon deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">Discount codes usable on courses, books and exams.</p>
        </div>
        <button type="button" onClick={() => setDraft({ ...EMPTY })} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
          + Add coupon
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No coupons yet. Click “Add coupon”.</p>
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;
              return (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/50 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-foreground">{c.code}</span>
                      <Badge tone={c.active && !expired ? "success" : "muted"}>{expired ? "EXPIRED" : c.active ? "ACTIVE" : "OFF"}</Badge>
                      <Badge tone="accent">{c.type === "PERCENT" ? `${c.value}% off` : `${formatBdt(c.value)} off`}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.description || "—"}
                      {c.minSubtotal > 0 ? ` · min ${formatBdt(c.minSubtotal)}` : ""}
                      {c.maxDiscount ? ` · max ${formatBdt(c.maxDiscount)}` : ""}
                      {c.appliesTo.length ? ` · ${c.appliesTo.join(", ")}` : " · all products"}
                      {c.usageLimit != null ? ` · used ${c.usedCount}/${c.usageLimit}` : ` · used ${c.usedCount}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => edit(c)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(c.id, c.code)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AdminModal open={Boolean(draft)} title={draft?.id ? "Edit coupon" : "New coupon"} onClose={() => setDraft(null)} wide>
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code *</span>
                <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="EID25" className={cn(inputCls, "font-mono uppercase")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
                <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Eid special 25% off" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type *</span>
                <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Draft["type"] })} className={inputCls}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed (৳)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Value *</span>
                <input type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value === "" ? "" : Number(e.target.value) })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Min subtotal (৳)</span>
                <input type="number" value={draft.minSubtotal} onChange={(e) => setDraft({ ...draft, minSubtotal: e.target.value === "" ? "" : Number(e.target.value) })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max discount (৳)</span>
                <input type="number" value={draft.maxDiscount} onChange={(e) => setDraft({ ...draft, maxDiscount: e.target.value === "" ? "" : Number(e.target.value) })} className={inputCls} placeholder="Optional cap" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Starts (optional)</span>
                <input type="date" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expires (optional)</span>
                <input type="date" value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usage limit</span>
                <input type="number" value={draft.usageLimit} onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value === "" ? "" : Number(e.target.value) })} className={inputCls} placeholder="Unlimited" />
              </label>
              <label className="flex items-center gap-2 pt-5 text-sm text-foreground">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-4 w-4 accent-[#F2A93B]" />
                Active
              </label>
            </div>

            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applies to (none = all products)</span>
              <div className="flex flex-wrap gap-3">
                {["course", "book", "exam"].map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm capitalize text-foreground">
                    <input
                      type="checkbox"
                      checked={draft.appliesTo.includes(t)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          appliesTo: e.target.checked ? [...draft.appliesTo, t] : draft.appliesTo.filter((x) => x !== t),
                        })
                      }
                      className="h-4 w-4 accent-[#F2A93B]"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={() => setDraft(null)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
                Cancel
              </button>
              <button type="button" onClick={save} disabled={busy} className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">
                {busy ? "Saving…" : "Save coupon"}
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
