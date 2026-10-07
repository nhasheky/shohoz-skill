"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminTitle } from "@/lib/use-admin-title";
import * as api from "@/lib/admin-api";
import { useToast } from "./admin-toast";
import { AdminModal, Badge, ConfirmDialog } from "./admin-ui";
import { PROVIDER_ID_HINT, PROVIDER_LABELS } from "@/lib/pixel-snippets";
import type { MarketingPixel } from "@/lib/types";
import { cn } from "@/lib/cn";
import { IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";

const PROVIDERS = Object.keys(PROVIDER_LABELS);

type Draft = {
  id?: string;
  name: string;
  provider: string;
  pixelId: string;
  headCode: string;
  bodyCode: string;
  enabled: boolean;
};

const EMPTY: Draft = { name: "", provider: "facebook", pixelId: "", headCode: "", bodyCode: "", enabled: true };

export function MarketingPage() {
  useAdminTitle("Marketing");
  const toast = useToast();
  const [pixels, setPixels] = useState<MarketingPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<MarketingPixel | null>(null);

  const load = useCallback(async () => {
    try {
      setPixels(await api.listMarketingPixels());
      setMode("live");
    } catch {
      setMode("demo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function openNew() {
    setEditing({ ...EMPTY });
  }

  function openEdit(p: MarketingPixel) {
    setEditing({
      id: p.id,
      name: p.name,
      provider: p.provider || "custom",
      pixelId: p.pixelId ?? "",
      headCode: p.headCode ?? "",
      bodyCode: p.bodyCode ?? "",
      enabled: p.enabled !== false,
    });
  }

  async function save(draft: Draft) {
    setBusy(true);
    const payload = {
      name: draft.name.trim() || PROVIDER_LABELS[draft.provider] || "Pixel",
      provider: draft.provider,
      pixelId: draft.pixelId.trim(),
      headCode: draft.headCode,
      bodyCode: draft.bodyCode,
      enabled: draft.enabled,
    };
    if (mode === "demo") {
      setPixels((rows) =>
        draft.id
          ? rows.map((r) => (r.id === draft.id ? { ...r, ...payload } : r))
          : [...rows, { id: `demo-${Date.now()}`, ...payload } as MarketingPixel],
      );
      setEditing(null);
      setBusy(false);
      toast.success("Saved (demo)");
      return;
    }
    try {
      if (draft.id) {
        const updated = await api.updateMarketingPixel(draft.id, payload);
        setPixels((rows) => rows.map((r) => (r.id === draft.id ? updated : r)));
      } else {
        const created = await api.createMarketingPixel(payload);
        setPixels((rows) => [...rows, created]);
      }
      toast.success(draft.id ? "Pixel updated" : "Pixel added");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: MarketingPixel) {
    const next = !(p.enabled !== false);
    setPixels((rows) => rows.map((r) => (r.id === p.id ? { ...r, enabled: next } : r)));
    if (mode === "demo") return;
    try {
      await api.updateMarketingPixel(p.id, { enabled: next });
    } catch {
      toast.error("Update failed");
      setPixels((rows) => rows.map((r) => (r.id === p.id ? { ...r, enabled: !next } : r)));
    }
  }

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    if (mode === "demo") {
      setPixels((rows) => rows.filter((r) => r.id !== confirm.id));
      setConfirm(null);
      setBusy(false);
      toast.success("Deleted (demo)");
      return;
    }
    try {
      await api.deleteMarketingPixel(confirm.id);
      setPixels((rows) => rows.filter((r) => r.id !== confirm.id));
      toast.success("Pixel deleted");
      setConfirm(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Marketing &amp; Pixels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Facebook, TikTok, GTM, GA4, Google Ads — যেকোনো ট্র্যাকিং পিক্সেল যোগ করুন, সাইটে সাথে সাথে বসে যাবে।
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <IconPlus width={16} height={16} /> Add pixel
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface/60 p-4 text-sm text-muted-foreground dark:bg-background/60">
        <p className="font-semibold text-foreground">কীভাবে কাজ করে</p>
        <p className="mt-1">
          নিচের যেকোনো পিক্সেল provider বেছে pixel/container ID বসালেই অটো base code সাইটের সব পেজে যুক্ত হবে। ID না থাকলে বা নিজের কোড চাইলে
          “Custom HTML” বেছে head/body কোড পেস্ট করুন। Purchase, AddToCart সহ কিছু ইভেন্ট অটোমেটিক পাঠানো হয়।
        </p>
      </div>

      {mode === "demo" && <p className="mt-2 text-xs text-muted-foreground">API unreachable — changes শুধু এই পেজে থাকবে (demo).</p>}

      {loading ? (
        <div className="mt-8 py-10 text-center text-sm text-muted-foreground">Loading pixels…</div>
      ) : pixels.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border py-14 text-center">
          <p className="text-sm text-muted-foreground">কোনো পিক্সেল যোগ করা হয়নি।</p>
          <button type="button" onClick={openNew} className="mt-3 text-sm font-bold text-accent hover:underline">Add your first pixel</button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {pixels.map((p) => {
            const on = p.enabled !== false;
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-extrabold text-foreground">{p.name}</p>
                    <Badge tone="sky">{PROVIDER_LABELS[p.provider] ?? p.provider}</Badge>
                    {on ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Paused</Badge>}
                  </div>
                  {p.pixelId && <p className="mt-1 font-mono text-xs text-muted-foreground">{p.pixelId}</p>}
                  {p.provider === "custom" && <p className="mt-1 text-xs text-muted-foreground">Custom head/body code</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(p)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      on ? "bg-accent" : "bg-muted",
                    )}
                    aria-label={on ? "Pause pixel" : "Activate pixel"}
                  >
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
                  </button>
                  <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent" aria-label="Edit">
                    <IconEdit width={16} height={16} />
                  </button>
                  <button type="button" onClick={() => setConfirm(p)} className="rounded-lg border border-danger/30 bg-danger/5 p-2 text-danger transition-colors hover:bg-danger/15" aria-label="Delete">
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <AdminModal open onClose={() => setEditing(null)} title={editing.id ? "Edit pixel" : "Add pixel"} wide>
          <PixelForm draft={editing} busy={busy} onSave={save} onClose={() => setEditing(null)} />
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete pixel"
        message={confirm ? `"${confirm.name}" পিক্সেলটি মুছে ফেলবেন?` : ""}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
        busy={busy}
      />
    </div>
  );
}

function PixelForm({
  draft,
  busy,
  onSave,
  onClose,
}: {
  draft: Draft;
  busy: boolean;
  onSave: (d: Draft) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Draft>(draft);
  const set = (k: keyof Draft, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));
  const inputCls = "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent";
  const isCustom = form.provider === "custom";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Facebook Main" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provider</span>
          <select value={form.provider} onChange={(e) => set("provider", e.target.value)} className={inputCls}>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
            ))}
          </select>
        </label>
        {!isCustom && (
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pixel / Container ID</span>
            <input value={form.pixelId} onChange={(e) => set("pixelId", e.target.value)} placeholder={PROVIDER_ID_HINT[form.provider] ?? ""} className={inputCls} />
          </label>
        )}
        <PasteField
          label={isCustom ? "Head code (inside <head>)" : "Head code override (optional)"}
          value={form.headCode}
          onChange={(v) => set("headCode", v)}
          placeholder={isCustom ? "<script>…</script>" : "Leave blank to use the auto-generated base code"}
          cls={inputCls}
        />
        <PasteField
          label={isCustom ? "Body code (top of <body>)" : "Body code override (optional)"}
          value={form.bodyCode}
          onChange={(v) => set("bodyCode", v)}
          placeholder={isCustom ? '<noscript>…</noscript>' : "e.g. GTM <noscript> fallback"}
          cls={inputCls}
        />
        <label className="flex items-center gap-2.5 text-sm text-foreground sm:col-span-2">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[#F2A93B]" />
          Active
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">Cancel</button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={busy || (!isCustom && !form.pixelId.trim() && !form.headCode.trim())}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : form.id ? "Save changes" : "Add pixel"}
        </button>
      </div>
    </div>
  );
}

function PasteField({ label, value, onChange, placeholder, cls }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; cls: string }) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(cls, "resize-y font-mono text-xs")} />
    </label>
  );
}
