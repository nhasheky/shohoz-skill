"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stars } from "@/components/ui/rating";
import { IconStar, IconUser, IconX } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ProductReview } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shohoz_token");
}

async function resizeImage(file: File): Promise<string> {
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
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

export function ReviewSection({
  productType,
  productId,
  initialReviews,
  rating,
  count,
  scrollSeconds = 6,
}: {
  productType: "course" | "book" | "exam";
  productId: string;
  initialReviews: ProductReview[];
  rating: number;
  count: number;
  scrollSeconds?: number;
}) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [myReview, setMyReview] = useState<ProductReview | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loggedIn, setLoggedIn] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${productType}/${encodeURIComponent(productId)}`, { cache: "no-store" });
      if (res.ok) setReviews((await res.json()) as ProductReview[]);
    } catch {
      /* keep initial */
    }
  }, [productType, productId]);

  const loadMine = useCallback(async () => {
    const token = readToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/mine`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!res.ok) return;
      const mine = (await res.json()) as ProductReview[];
      setMyReview(mine.find((r) => r.productType === productType && r.productId === productId) ?? null);
    } catch {
      /* ignore */
    }
  }, [productType, productId]);

  useEffect(() => {
    setLoggedIn(Boolean(readToken()));
    reload();
    loadMine();
  }, [reload, loadMine]);

  // Auto-scroll the reviews carousel; interval controlled from the admin panel.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || reviews.length <= 1) return;
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    const id = setInterval(
      () => {
        if (paused) return;
        const card = el.querySelector<HTMLElement>("[data-rev]");
        const step = card ? card.offsetWidth + 16 : el.clientWidth;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
        el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
      },
      Math.max(2, scrollSeconds) * 1000,
    );
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [reviews, scrollSeconds]);

  function openForm() {
    if (myReview) {
      setStars(myReview.rating);
      setText(myReview.text);
      setImageUrl(myReview.imageUrl ?? "");
    } else {
      setStars(5);
      setText("");
      setImageUrl("");
    }
    setError("");
    setFormOpen(true);
  }

  async function submit() {
    if (!text.trim()) {
      setError("রিভিউ লিখুন (text বাধ্যতামূলক)।");
      return;
    }
    const token = readToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const body = { productType, productId, rating: stars, text: text.trim(), imageUrl: imageUrl || undefined };
      const res = myReview
        ? await fetch(`${API_URL}/api/reviews/${myReview.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ rating: stars, text: text.trim(), imageUrl: imageUrl || undefined }) })
        : await fetch(`${API_URL}/api/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string })?.message || "রিভিউ সেভ হয়নি।");
      setFormOpen(false);
      await Promise.all([reload(), loadMine()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "রিভিউ সেভ হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function removeMine() {
    const token = readToken();
    if (!token || !myReview) return;
    if (typeof window !== "undefined" && !window.confirm("আপনার রিভিউটি ডিলিট করবেন?")) return;
    try {
      await fetch(`${API_URL}/api/reviews/${myReview.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setMyReview(null);
      await reload();
    } catch {
      /* ignore */
    }
  }

  const total = reviews.length;
  const shownRating = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : rating;
  const shownCount = total || count;
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const n = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, pct: total ? n / total : Math.max(0.02, 0.55 - (5 - star) * 0.16) };
  });

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" id={`${productType}-${productId}-reviews`}>
      <div>
        <h3 className="font-display text-lg font-extrabold text-foreground">পাঠকদের রিভিউ</h3>
        <div className="mt-4 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
          <div className="font-display text-5xl font-extrabold text-foreground">{shownRating.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            <Stars rating={shownRating} size={18} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{shownCount.toLocaleString("en-BD")} টি রিভিউর ভিত্তিতে</p>
          <div className="mt-5 space-y-1.5">
            {breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-xs">
                <span className="w-6 shrink-0 text-muted-foreground">{b.star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(b.pct * 100)}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-muted-foreground">{Math.round(shownCount * b.pct)}</span>
              </div>
            ))}
          </div>

          {loggedIn ? (
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={openForm} className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
                {myReview ? "আপনার রিভিউ এডিট করুন" : "রিভিউ লিখুন"}
              </button>
              {myReview && (
                <button type="button" onClick={removeMine} className="text-xs font-semibold text-danger hover:underline">
                  আমার রিভিউ ডিলিট করুন
                </button>
              )}
            </div>
          ) : (
            <a href="/login" className="mt-5 block rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
              রিভিউ দিতে লগইন করুন
            </a>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            এখনো কোনো রিভিউ নেই — প্রথম হয়ে আপনার অভিজ্ঞতা শেয়ার করুন।
          </div>
        ) : (
          <div ref={scrollerRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            {reviews.map((r) => (
              <figure data-rev key={r.id} className="w-[260px] shrink-0 snap-start rounded-3xl border border-border bg-card p-5 shadow-card sm:w-[300px]">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} size={13} />
                  <span className="font-display text-2xl leading-none text-accent/60">&ldquo;</span>
                </div>
                <blockquote className="mt-3 line-clamp-4 text-sm leading-relaxed text-foreground/90">“{r.text}”</blockquote>
                {r.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="mt-3 h-32 w-full rounded-xl object-cover" />
                )}
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-surface">
                    <IconUser width={16} height={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={() => setFormOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-pop sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-extrabold text-foreground">{myReview ? "রিভিউ এডিট" : "রিভিউ লিখুন"}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="বন্ধ">
                <IconX width={18} height={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} star`}>
                  <IconStar width={26} height={26} className={n <= stars ? "text-accent" : "text-muted"} />
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="আপনার অভিজ্ঞতা লিখুন *"
              className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />

            <div className="mt-3">
              {imageUrl ? (
                <div className="relative w-max">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="h-28 rounded-xl object-cover" />
                  <button type="button" onClick={() => setImageUrl("")} className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-danger-foreground" aria-label="ছবি মুছুন">
                    <IconX width={14} height={14} />
                  </button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">
                  📷 ছবি যোগ করুন (optional)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImageUrl(await resizeImage(file));
                    }}
                  />
                </label>
              )}
            </div>

            {error && <p className="mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-xs font-semibold text-danger">{error}</p>}

            <button type="button" onClick={submit} disabled={busy} className="mt-4 w-full rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">
              {busy ? "সেভ হচ্ছে…" : "রিভিউ সাবমিট করুন"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
