"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, ConfirmDialog, Pagination, SearchInput } from "./admin-ui";
import { useToast } from "./admin-toast";
import { IconChevronDown, IconChevronUp, IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";

export type AdminColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
};

export type PageResult<T> = { total: number; page: number; perPage: number; items: T[] };

const PER_PAGE = 10;

export function AdminList<T extends { id: string }>({
  title,
  description,
  columns,
  newHref,
  newLabel = "Add new",
  editHref,
  fetchList,
  seed,
  onDelete,
  searchPlaceholder = "Search…",
  deleteMessage,
}: {
  title: string;
  description?: string;
  columns: AdminColumn<T>[];
  newHref: string;
  newLabel?: string;
  editHref: (id: string) => string;
  fetchList: (q: string, page: number, perPage: number) => Promise<PageResult<T>>;
  seed: () => T[];
  onDelete: (id: string) => Promise<void>;
  searchPlaceholder?: string;
  deleteMessage?: (row: T) => string;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [confirmRow, setConfirmRow] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRef = useRef(fetchList);
  const seedRef = useRef(seed);
  const onDeleteRef = useRef(onDelete);
  const demoRef = useRef<T[] | null>(null);

  useEffect(() => {
    fetchRef.current = fetchList;
    seedRef.current = seed;
    onDeleteRef.current = onDelete;
  }, [fetchList, seed, onDelete]);

  const load = useCallback(async (query: string, pg: number) => {
    setLoading(true);
    try {
      const res = await fetchRef.current(query, pg, PER_PAGE);
      setRows(res.items);
      setTotal(res.total);
      setMode("live");
    } catch {
      if (!demoRef.current) demoRef.current = seedRef.current();
      const all = demoRef.current.filter((r) => !query || JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
      setTotal(all.length);
      setRows(all.slice((pg - 1) * PER_PAGE, pg * PER_PAGE));
      setMode("demo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q, page), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, page, load]);

  async function confirmDelete() {
    if (!confirmRow) return;
    setDeleting(true);
    if (mode === "demo") {
      demoRef.current = demoRef.current?.filter((r) => r.id !== confirmRow.id) ?? null;
      setConfirmRow(null);
      toast.success("Deleted (demo mode)");
      load(q, page);
      setDeleting(false);
      return;
    }
    try {
      await onDeleteRef.current(confirmRow.id);
      toast.success("Deleted");
      setConfirmRow(null);
      load(q, page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function toggleSort(key: string) {
    if (!columns.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const visibleRows = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as Record<string, unknown>)[sortKey];
    const bv = (b as Record<string, unknown>)[sortKey];
    if (av === bv) return 0;
    return sortDir === "asc"
      ? String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true })
      : String(bv ?? "").localeCompare(String(av ?? ""), undefined, { numeric: true });
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56 sm:w-72">
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={searchPlaceholder} />
          </div>
          <Link href={newHref} className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover">
            <IconPlus width={15} height={15} /> {newLabel}
          </Link>
        </div>
      </div>

      {mode === "demo" && (
        <p className="mt-2 text-xs text-muted-foreground">
          API unreachable — showing demo data. Start the API to manage the live database.
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={cn("px-5 py-3", c.sortable && "cursor-pointer select-none hover:text-foreground", c.className)} onClick={() => toggleSort(c.key)}>
                    <span className="flex items-center gap-1">
                      {c.label}
                      {c.sortable &&
                        (sortKey === c.key ? (sortDir === "asc" ? <IconChevronUp width={12} height={12} /> : <IconChevronDown width={12} height={12} />) : <IconChevronDown width={12} height={12} className="opacity-30" />)}
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing here yet.</td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/40">
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-5 py-3", c.className)}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link href={editHref(row.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent" aria-label="Edit">
                          <IconEdit width={14} height={14} />
                        </Link>
                        <button type="button" onClick={() => setConfirmRow(row)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-danger hover:text-danger" aria-label="Delete">
                          <IconTrash width={14} height={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(confirmRow)}
        title="Delete item"
        message={confirmRow ? deleteMessage?.(confirmRow) ?? "This will permanently delete the item. This action cannot be undone." : ""}
        onCancel={() => setConfirmRow(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      />
    </div>
  );
}

export { PER_PAGE };

export function PubBadge({ published }: { published: unknown }) {
  return published ? <Badge tone="success">Published</Badge> : <Badge tone="muted">Draft</Badge>;
}
