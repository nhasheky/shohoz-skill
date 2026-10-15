"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/admin-api";
import { useAdminTitle } from "@/lib/use-admin-title";
import { Badge, ConfirmDialog, Pagination, SearchInput } from "./admin-ui";
import { useToast } from "./admin-toast";
import { IconCopy, IconDownload, IconRefresh, IconTrash } from "@/components/ui/icons";

const inputCls = "rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

export function NewsletterPage() {
  useAdminTitle("Newsletter");
  const toast = useToast();

  const [rows, setRows] = useState<api.NewsletterSubscriber[]>([]);
  const [counts, setCounts] = useState({ total: 0, subscribed: 0, unsubscribed: 0 });
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "SUBSCRIBED" | "UNSUBSCRIBED">("ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<api.NewsletterSubscriber | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listSubscribers(q.trim() || undefined, status, page, perPage);
      setRows(res.items);
      setCounts(res.counts);
      setTotal(res.total);
      setPerPage(res.perPage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page, perPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((r) => r.id));
  }

  function toggleOne(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function setRowStatus(row: api.NewsletterSubscriber, next: "SUBSCRIBED" | "UNSUBSCRIBED") {
    try {
      await api.updateSubscriber(row.id, { status: next });
      toast.success(next === "SUBSCRIBED" ? "Subscribed" : "Unsubscribed");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function remove() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await api.deleteSubscriber(confirmDelete.id);
      toast.success("Subscriber deleted");
      setConfirmDelete(null);
      setSelected((s) => s.filter((x) => x !== confirmDelete.id));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function bulk(action: "DELETE" | "STATUS", next?: "SUBSCRIBED" | "UNSUBSCRIBED") {
    if (!selected.length) {
      toast.error("Age kono subscriber select korun.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.bulkSubscribers(selected, action, next);
      toast.success(`${res.count} subscribers updated`);
      setSelected([]);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBusy(false);
    }
  }

  const exportRows = useCallback(async () => {
    try {
      return await api.listSubscriberEmails(status);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function copyEmails() {
    const list = await exportRows();
    if (!list.length) {
      toast.info("Kono email nei.");
      return;
    }
    try {
      await navigator.clipboard.writeText(list.map((r) => r.email).join(", "));
      toast.success(`${list.length} ta email copy hoyeche.`);
    } catch {
      toast.error("Copy kora gelo na — CSV download korun.");
    }
  }

  async function downloadCsv() {
    const list = await exportRows();
    if (!list.length) {
      toast.info("Kono email nei.");
      return;
    }
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Email", "Name", "Phone", "Status", "Subscribed at"].map(cell).join(","),
      ...list.map((r) => [r.email, r.name, r.phone, r.status, new Date(r.createdAt).toISOString()].map(cell).join(",")),
    ].join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV download hoyeche.");
  }

  const stats = useMemo(
    () => [
      { label: "Total", value: counts.total },
      { label: "Subscribed", value: counts.subscribed },
      { label: "Unsubscribed", value: counts.unsubscribed },
    ],
    [counts],
  );

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-extrabold text-foreground">Newsletter</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Footer signup theke asha email gulo ekhane save hoy — pore ei list diye marketing/promotion mail pathate parben.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1">
            <SearchInput
              value={q}
              onChange={(v) => {
                setQ(v);
                setPage(1);
              }}
              placeholder="Email / name / phone diye khujun…"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className={inputCls}
          >
            <option value="ALL">All status</option>
            <option value="SUBSCRIBED">Subscribed</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </select>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className={inputCls}
            aria-label="Rows per page"
          >
            {[20, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            <IconRefresh width={15} height={15} /> Refresh
          </button>
          <button
            type="button"
            onClick={copyEmails}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            <IconCopy width={15} height={15} /> Copy emails
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <IconDownload width={15} height={15} /> CSV
          </button>
        </div>

        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-3 py-2.5">
            <span className="text-sm font-semibold text-foreground">{selected.length} selected</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulk("STATUS", "SUBSCRIBED")}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Mark subscribed
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulk("STATUS", "UNSUBSCRIBED")}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Mark unsubscribed
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulk("DELETE")}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-danger-foreground hover:opacity-90 disabled:opacity-50"
            >
              Delete
            </button>
            <button type="button" onClick={() => setSelected([])} className="text-xs font-bold text-muted-foreground hover:text-foreground">
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Kono subscriber nei.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="h-4 w-4" />
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name / Phone</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`Select ${r.email}`}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${r.email}`} className="font-semibold text-foreground hover:text-accent">
                        {r.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.name || "—"}
                      {r.phone ? <span className="ml-2 font-mono text-xs">{r.phone}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="sky">{r.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "SUBSCRIBED" ? "success" : "muted"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("en-BD")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRowStatus(r, r.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED")}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
                        >
                          {r.status === "SUBSCRIBED" ? "Unsubscribe" : "Subscribe"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(r)}
                          aria-label={`Delete ${r.email}`}
                          className="rounded-lg border border-border p-2 text-muted-foreground hover:border-danger hover:text-danger"
                        >
                          <IconTrash width={14} height={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />}
      </div>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete subscriber?"
        message={`${confirmDelete?.email ?? ""} ke list theke muchhe felben. Eita ferot asha jabe na.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
        busy={busy}
      />
    </div>
  );
}
