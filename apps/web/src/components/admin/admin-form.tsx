"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { FieldInput, type FieldDef } from "./admin-ui";
import { useToast } from "./admin-toast";
import { IconArrowRight, IconChevronLeft } from "@/components/ui/icons";

/** Convert a record into form state (strings/numbers/checkboxes/JSON strings). */
export function toForm(fields: FieldDef[], initial?: Record<string, unknown> | null): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = initial?.[f.name];
    if (f.type === "checkbox") base[f.name] = Boolean(raw);
    else if (f.type === "number") base[f.name] = raw === undefined || raw === null ? "" : Number(raw);
    else if (f.json) base[f.name] = raw === undefined || raw === null ? "" : JSON.stringify(raw, null, 2);
    else base[f.name] = raw ?? "";
  }
  return base;
}

/** Build the DTO from form state + extra (editor-managed) keys. Returns null on validation error. */
export function buildDto(fields: FieldDef[], form: Record<string, unknown>): Record<string, unknown> | null {
  const dto: Record<string, unknown> = {};
  const fieldNames = new Set(fields.map((f) => f.name));
  for (const f of fields) {
    let v = form[f.name];
    if (f.type === "number") {
      v = v === "" || v === undefined || v === null ? undefined : Number(v);
    }
    if (f.json) {
      if (typeof v === "string" && v.trim()) {
        try {
          v = JSON.parse(v);
        } catch {
          return { __error: `"${f.label}" is not valid JSON.` };
        }
      } else {
        v = undefined;
      }
    }
    if (v !== undefined) dto[f.name] = v;
  }
  // Editor-managed keys (arrays/objects) pass through.
  for (const k of Object.keys(form)) {
    if (!fieldNames.has(k) && form[k] !== undefined) dto[k] = form[k];
  }
  return dto;
}

export function AdminForm({
  title,
  subtitle,
  fields,
  initial,
  backHref,
  submitLabel = "Save",
  onSubmit,
  children,
}: {
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  initial?: Record<string, unknown> | null;
  backHref: string;
  submitLabel?: string;
  onSubmit: (dto: Record<string, unknown>) => Promise<void>;
  children?: (form: Record<string, unknown>, set: (name: string, value: unknown) => void) => ReactNode;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>(() => toForm(fields, initial));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (name: string, value: unknown) => setForm((s) => ({ ...s, [name]: value }));

  function validate(): string {
    for (const f of fields) {
      if (f.required) {
        const v = form[f.name];
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
          return `"${f.label}" is required.`;
        }
      }
    }
    return "";
  }

  async function submit() {
    const req = validate();
    if (req) {
      setError(req);
      return;
    }
    const dto = buildDto(fields, form);
    if (!dto) return;
    if (dto.__error) {
      setError(String(dto.__error));
      delete dto.__error;
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(dto);
      toast.success("Saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed — is the API running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link href={backHref} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
          <IconChevronLeft width={14} height={14} /> Back to list
        </Link>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => set(f.name, v)} />
          ))}
        </div>

        {children?.(form, set)}

        {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={cn("flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50")}
          >
            {submitting ? "Saving…" : submitLabel}
            {!submitting && <IconArrowRight width={15} height={15} />}
          </button>
          <Link href={backHref} className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export const adminInputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";
