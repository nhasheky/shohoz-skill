"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronLeft, IconChevronRight, IconSearch, IconX } from "@/components/ui/icons";
import { RichTextEditor } from "./rich-text-editor";

export function AdminModal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-pop sm:rounded-3xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close">
            <IconX width={18} height={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-pop">
        <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-danger px-4 py-2.5 text-sm font-bold text-danger-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <IconSearch width={15} height={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent"
      />
    </div>
  );
}

export function Pagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm">
      <span className="text-muted-foreground">
        {total === 0 ? "0 items" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <IconChevronLeft width={15} height={15} />
        </button>
        <span className="min-w-[3.5rem] text-center font-mono text-xs text-muted-foreground">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <IconChevronRight width={15} height={15} />
        </button>
      </div>
    </div>
  );
}

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "checkbox" | "select" | "richtext" | "image" | "file";
  options?: string[];
  placeholder?: string;
  help?: string;
  span2?: boolean;
  json?: boolean;
  required?: boolean;
};

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

export function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const cls = cn(inputCls, field.span2 && "sm:col-span-2");
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#F2A93B]" />
        {field.label}
      </label>
    );
  }
  return (
    <label className={cn("block", field.span2 && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          rows={3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(cls, "resize-y", field.json && "font-mono text-xs")}
      ) : field.type === "number" ? (
        <input type="number" value={value === undefined || value === null || value === "" ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} placeholder={field.placeholder} className={cls} />
      ) : field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={cls}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "richtext" ? (
        <RichTextEditor value={String(value ?? "")} onChange={onChange} placeholder={field.placeholder} />
      ) : field.type === "image" || field.type === "file" ? (
        <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? "URL to image or file..."} className={cls} />
      ) : (
        <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={cls} />
      )}
      {field.help && <span className="mt-1 block text-[11px] text-muted-foreground">{field.help}</span>}
    </label>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "danger" | "accent" | "sky" }) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent/15 text-accent",
    sky: "bg-sky/10 text-sky",
  };
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", tones[tone])}>{children}</span>;
}

export function useSearchPagination(initialPerPage = 10) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(initialPerPage);
  return { q, setQ, page, setPage, perPage, reset: () => setPage(1) };
}
