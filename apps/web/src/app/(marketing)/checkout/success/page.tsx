"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BackgroundOrbs } from "@/components/layout/background";
import { ButtonLink } from "@/components/ui/button";
import { formatBdt, formatDate } from "@/lib/format";
import { IconCheckCircle, IconLock } from "@/components/ui/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

type Summary = {
  id: string;
  orderNumber: number | null;
  createdAt: string;
  status: string;
  paymentMethod: string;
  productType: string;
  productId: string;
  productTitle: string;
  variant: string | null;
  quantity: number;
  amount: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  isPhysical: boolean;
  address: string | null;
  region: string | null;
  items: { productType: string; title: string; variant?: string | null; quantity: number; unitPrice: number }[] | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
};

type Sug = { type: string; slug: string; title: string; thumbnailUrl: string | null; category: string; rating: number };

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "";
  const digital = params.get("digital") === "1";
  const [order, setOrder] = useState<Summary | null>(null);
  const [sugs, setSugs] = useState<Sug[]>([]);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${API_URL}/api/orders/${orderId}/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Summary | null) => setOrder(d))
      .catch(() => {});
    fetch(`${API_URL}/api/orders/${orderId}/suggestions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Sug[]) => setSugs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [orderId]);

  const itemLines =
    order?.items && order.items.length
      ? order.items
      : order
        ? [{ productType: order.productType, title: order.productTitle, variant: order.variant, quantity: order.quantity, unitPrice: order.amount }]
        : [];

  return (
    <main className="relative overflow-hidden">
      <BackgroundOrbs />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <IconCheckCircle width={32} height={32} />
          </span>

          <div className="mt-5 text-center">
            <p className="font-display text-lg font-extrabold text-accent">ধন্যবাদ</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground sm:text-3xl">অভিনন্দন !!!</h1>
            <p className="mt-4 font-display text-lg font-extrabold leading-relaxed text-foreground">
              আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে।
            </p>
            <p className="mt-3 font-semibold leading-relaxed text-foreground">
              ২-৩ দিনের মধ্যে বইটি হাতে পেয়ে যাবেন। আশা করি ডেলিভারি ম্যানের কলটি ধরবেন এবং যথাসময়ে বইটি রিসিভ করবেন। আপনার চাকরি পরীক্ষায় সফল হোন সেই দোয়া রইলো।
            </p>
          </div>

          {digital && (
            <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-left">
              <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
                <IconLock width={16} height={16} className="mt-0.5 shrink-0 text-accent" />
                ডিজিটাল কোর্স/এক্সাম পেতে যে ফোন/ইমেইল দিয়েছেন সেটি দিয়েই লগইন করুন — আপনার কেনাকাটা তখন অ্যাকাউন্টে যুক্ত হয়ে ছাড় হয়ে যাবে।
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <ButtonLink href="/login" variant="accent">Login</ButtonLink>
                <ButtonLink href="/register" variant="outline">Create account</ButtonLink>
              </div>
            </div>
          )}

          {order && (
            <div className="mt-6 rounded-2xl border border-border bg-surface/50 p-5 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order number</p>
                  <p className="mt-0.5 font-display text-lg font-extrabold text-foreground">{order.orderNumber ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="mt-0.5 font-semibold text-foreground">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {itemLines.map((it, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{it.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {it.variant ? `${it.variant === "pdf" ? "Online PDF" : "Hardcopy"} · ` : ""}Qty {it.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-foreground">{formatBdt(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold text-foreground">{formatBdt(order.amount)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span className="font-semibold">− {formatBdt(order.discount)}</span></div>}
                {order.isPhysical && <div className="flex justify-between"><span className="text-muted-foreground">Delivery ({order.region === "DHAKA" ? "ঢাকার ভেতরে" : "ঢাকার বাহিরে"})</span><span className="font-semibold text-foreground">{formatBdt(order.deliveryCharge)}</span></div>}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent bg-accent/10 px-4 py-3">
                <span className="font-display text-base font-extrabold text-foreground">সর্বমোট</span>
                <span className="font-display text-2xl font-extrabold text-accent">{formatBdt(order.total)}</span>
              </div>

              {(order.address || order.guestName || order.guestPhone) && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিলিং / ডেলিভারি ঠিকানা</p>
                  {order.guestName && <p className="mt-1 text-sm font-semibold text-foreground">{order.guestName}</p>}
                  {order.guestPhone && <p className="text-sm text-muted-foreground">{order.guestPhone}</p>}
                  {order.address && <p className="text-sm text-muted-foreground">{order.address}{order.region ? `, ${order.region === "DHAKA" ? "ঢাকার ভেতরে" : "ঢাকার বাহিরে"}` : ""}</p>}
                </div>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                Payment: <span className="font-semibold text-foreground">{order.paymentMethod}</span> · Status: <span className="font-semibold text-foreground">{order.status}</span>
              </p>
            </div>
          )}

          {!order && orderId && <p className="mt-6 text-center text-sm text-muted-foreground">Loading order details…</p>}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/" variant="outline">Back to home</ButtonLink>
            <ButtonLink href="/dashboard" variant="accent">Go to dashboard</ButtonLink>
          </div>
        </div>

        {sugs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-extrabold text-foreground">আপনার ভালো লাগতে পারে</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {sugs.map((s) => (
                <Link key={`${s.type}-${s.slug}`} href={`/${s.type}/${s.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {s.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{s.type} · {s.category}</p>
                    <h3 className="mt-1 font-display text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{s.rating.toFixed(1)} ★</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
