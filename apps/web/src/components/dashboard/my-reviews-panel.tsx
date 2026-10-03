"use client";

import { useCallback, useEffect, useState } from "react";
import { Stars } from "@/components/ui/rating";
import { IconStar, IconX } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";
const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent";

type Mine = {
  id: string;
  productType: string;
  productId: string;
  rating: number;
  text: string;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
};
type Opt = { type: string; id: string; title: string };
type Draft = { id?: string; productType: string; productId: string; rating: number; text: string; imageUrl: string };

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shohoz_token");
}

async function resize(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const scale = Math.min(1, 900 / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

export function MyReviewsPanel() {
  const [reviews, setReviews] = useState<Mine[]>([]);
  const [options, setOptions] = useState<Opt[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const t = token();
    if (!t) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/mine`, { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
      if (res.ok) setReviews((await res.json()) as Mine[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    Promise.all([
      fetch(`${API_URL}/api/courses`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/api/books`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/api/exams`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([c, b, e]: [Array<{ id: string; title: string }>, Array<{ id: string; title: string }>, Array<{ id: string; title: string }>]) => {
        setOptions([
          ...c.map((x) => ({ type: "course", id: x.id, title: x.title })),
          ...b.map((x) => ({ type: "book", id: x.id, title: x.title })),
          ...e.map((x) => ({ type: "exam", id: x.id, title: x.title })),
        ]);
      })
      .catch(() => {});
  }, [load]);

  const titleOf = (t: string, id: string) => options.find((o) => o.type === t && o.id === id)?.title ?? id;

  async function save() {
    if (!draft) return;
    if (!draft.productId) return setError("একটি প্রোডাক্ট বেছে নিন।");
    if (!draft.text.trim()) return setError("রিভিউ লিখুন (text বাধ্যতামূলক)।");
    const t = token();
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const body = { productType: draft.productType, productId: draft.productId, rating: draft.rating, text: draft.text.trim(), imageUrl: draft.imageUrl || undefined };
      const res = draft.id
        ? await fetch(`${API_URL}/api/reviews/${draft.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ rating: draft.rating, text: draft.text.trim(), imageUrl: draft.imageUrl || undefined }) })
        : await fetch(`${API_URL}/api/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string })?.message || "সেভ হয়নি।");
      setDraft(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "সেভ হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Mine) {
    const t = token();
    if (!t) return;
    if (typeof window !== "undefined" && !window.confirm("রিভিউটি ডিলিট করবেন?")) return;
    await fetch(`${API_URL}/api/reviews/${r.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    await load();
  }

  const productOptions = options.filter((o) => o.type === draft?.productType);

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">আমার রিভিউ</h2>
          <p className="mt-1 text-sm text-muted-foreground">যেকোনো বই, কোর্স বা এক্সামের রিভিউ দিন — কেনা লাগবে না।</p>
        </div>
        <button type="button" onClick={() => { setError(""); setDraft({ productType: "book", productId: "", rating: 5, text: "", imageUrl: "" }); }} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
          + রিভিউ লিখুন
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">আপনি এখনো কোনো রিভিউ লেখেননি।</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex gap-3">
                {r.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-foreground">{titleOf(r.productType, r.productId)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars rating={r.rating} size={12} />
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)} · {r.status}</span>
                  </div>
                  <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">“{r.text}”</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setError(""); setDraft({ id: r.id, productType: r.productType, productId: r.productId, rating: r.rating, text: r.text, imageUrl: r.imageUrl ?? "" }); }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">এডিট</button>
                <button type="button" onClick={() => remove(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10">ডিলিট</button>
              </div>
            </div>
          ))
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={() => setDraft(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-pop sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-extrabold text-foreground">{draft.id ? "রিভিউ এডিট" : "রিভিউ লিখুন"}</h3>
              <button type="button" onClick={() => setDraft(null)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="বন্ধ"><IconX width={18} height={18} /></button>
            </div>

            {!draft.id && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select value={draft.productType} onChange={(e) => setDraft({ ...draft, productType: e.target.value, productId: "" })} className={inputCls}>
                  <option value="course">Course</option>
                  <option value="book">Book</option>
                  <option value="exam">Exam</option>
                </select>
                <select value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value })} className={inputCls}>
                  <option value="">— প্রোডাক্ট —</option>
                  {productOptions.map((o) => (<option key={o.id} value={o.id}>{o.title}</option>))}
                </select>
              </div>
            )}

            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setDraft({ ...draft, rating: n })} aria-label={`${n} star`}>
                  <IconStar width={22} height={22} className={n <= draft.rating ? "text-accent" : "text-muted"} />
                </button>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">{draft.rating}★</span>
            </div>

            <textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={4} placeholder="আপনার অভিজ্ঞতা লিখুন *" className={cn(inputCls, "mt-3 resize-y")} />

            <div className="mt-3">
              {draft.imageUrl ? (
                <div className="relative w-max">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.imageUrl} alt="" className="h-24 rounded-xl object-cover" />
                  <button type="button" onClick={() => setDraft({ ...draft, imageUrl: "" })} className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-danger-foreground" aria-label="remove">✕</button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">
                  📷 ছবি যোগ করুন (optional)
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, imageUrl: await resize(f) }); }} />
                </label>
              )}
            </div>

            {error && <p className="mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-xs font-semibold text-danger">{error}</p>}

            <button type="button" onClick={save} disabled={busy} className="mt-4 w-full rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">
              {busy ? "সেভ হচ্ছে…" : "সাবমিট করুন"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
