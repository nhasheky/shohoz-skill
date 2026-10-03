"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatBdt } from "@/lib/format";
import { cn } from "@/lib/cn";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";
type Region = "DHAKA" | "OUTSIDE";
type Method = "COD" | "SSLCOMMERZ";

const inputCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

function readStoredUser(): { name?: string; phone?: string; email?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("shohoz_user");
    return raw ? (JSON.parse(raw) as { name?: string; phone?: string; email?: string }) : null;
  } catch {
    return null;
  }
}

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const [settings, setSettings] = useState({ deliveryChargeDhaka: 60, deliveryChargeOutside: 120, codEnabled: true, sslcommerzEnabled: true });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<Region>("OUTSIDE");
  const [method, setMethod] = useState<Method>("SSLCOMMERZ");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; description?: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(localStorage.getItem("shohoz_token")));
    const stored = readStoredUser();
    if (stored) {
      setName((v) => v || stored.name || "");
      setPhone((v) => v || stored.phone?.replace(/^\+88/, "") || "");
      setEmail((v) => v || stored.email || "");
    }
    fetch(`${API_URL}/api/site-settings`, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Partial<typeof settings> | null) => {
        if (s) setSettings((prev) => ({ ...prev, ...s }));
      })
      .catch(() => {});
  }, []);

  const anyPhysical = cart.items.some((i) => i.isPhysical);
  const anyDigital = cart.items.some((i) => !i.isPhysical);
  const deliveryCharge = anyPhysical ? (region === "DHAKA" ? settings.deliveryChargeDhaka : settings.deliveryChargeOutside) : 0;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, cart.subtotal - discount) + deliveryCharge;

  const allowedMethods = useMemo<Method[]>(() => {
    const methods: Method[] = [];
    if (anyPhysical && settings.codEnabled) methods.push("COD");
    if (settings.sslcommerzEnabled) methods.push("SSLCOMMERZ");
    return methods;
  }, [anyPhysical, settings.codEnabled, settings.sslcommerzEnabled]);
  const activeMethod: Method = allowedMethods.includes(method) ? method : (allowedMethods[0] ?? "SSLCOMMERZ");

  useEffect(() => {
    setApplied(null);
    setCouponMsg("");
  }, [cart.items]);

  async function applyCoupon() {
    if (!coupon.trim() || !cart.items.length) return;
    setCouponBusy(true);
    setCouponMsg("");
    try {
      const res = await fetch(`${API_URL}/api/orders/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: coupon.trim(),
          items: cart.items.map((i) => ({ productType: i.productType, productId: i.productId, variant: i.variant, duration: i.duration, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message || "Invalid coupon.");
      setApplied({ code: data.code, discount: data.discount, description: data.description });
      setCouponMsg(`Applied — you save ${formatBdt(data.discount)}`);
    } catch (e) {
      setApplied(null);
      setCouponMsg(e instanceof Error ? e.message : "Invalid coupon.");
    } finally {
      setCouponBusy(false);
    }
  }

  async function checkout() {
    setError("");
    if (!cart.items.length) return;
    if (!name.trim()) return setError("আপনার সম্পূর্ণ নাম লিখুন।");
    if (!/^01\d{9}$/.test(phone.replace(/\D/g, ""))) return setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
    if (anyPhysical && !address.trim()) return setError("আপনার সম্পূর্ণ ঠিকানা লিখুন।");
    if (anyDigital && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("সঠিক Gmail / ইমেইল অ্যাড্রেস দিন।");

    setBusy(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("shohoz_token") : null;
      const body: Record<string, unknown> = {
        items: cart.items.map((i) => ({ productType: i.productType, productId: i.productId, variant: i.variant, duration: i.duration, quantity: i.quantity })),
        paymentMethod: total === 0 ? "SSLCOMMERZ" : activeMethod,
      };
      if (applied?.code) body.couponCode = applied.code;
      if (!loggedIn) {
        body.guestName = name.trim();
        body.guestPhone = phone.replace(/\D/g, "");
        body.guestEmail = email.trim().toLowerCase();
      }
      if (anyPhysical) {
        body.address = address.trim();
        body.region = region;
      }
      const res = await fetch(`${API_URL}/api/orders/checkout-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message || `Checkout failed (${res.status})`);

      const orderId = data.orderId as string;
      const status = data.status as string;
      const paymentUrl = data.paymentUrl as string | null;
      cart.clear();

      if (status === "PAID") {
        router.push(`/checkout/success?orderId=${orderId}&status=PAID&digital=${anyPhysical ? "0" : "1"}`);
        return;
      }
      if (activeMethod === "COD") {
        router.push(`/checkout/success?orderId=${orderId}&status=PENDING&digital=0`);
        return;
      }
      if (activeMethod === "SSLCOMMERZ" && paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      router.push(`/checkout/success?orderId=${orderId}&status=PENDING&digital=${anyPhysical ? "0" : "1"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!cart.ready) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
        </div>
      </main>
    );
  }

  if (!cart.items.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add books (and more) to your cart and check out together.</p>
        <Link href="/books" className="mt-6 inline-flex rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
          Browse Books
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-extrabold text-foreground">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">{cart.count} item{cart.count > 1 ? "s" : ""} ready to check out</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.key} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/${item.productType}/${item.slug}`} className="font-display text-sm font-bold text-foreground hover:text-primary">
                  {item.title}
                </Link>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {item.productType}
                  {item.variant ? ` · ${item.variant === "pdf" ? "Online PDF" : "Hardcopy"}` : ""}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button type="button" aria-label="kom" onClick={() => cart.setQuantity(item.key, item.quantity - 1)} disabled={item.quantity <= 1} className="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-40">−</button>
                    <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                    <button type="button" aria-label="beshi" onClick={() => cart.setQuantity(item.key, item.quantity + 1)} className="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:text-foreground">+</button>
                  </div>
                  <div className="text-right">
                    <span className="block font-display text-sm font-extrabold text-foreground">{formatBdt(item.unitPrice * item.quantity)}</span>
                    <button type="button" onClick={() => cart.remove(item.key)} className="text-xs font-semibold text-danger hover:underline">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link href="/books" className="inline-block text-sm font-bold text-accent hover:underline">+ Add more items</Link>
        </div>

        {/* Summary + checkout */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatBdt(cart.subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>Coupon ({applied?.code})</span>
                  <span className="font-semibold">− {formatBdt(discount)}</span>
                </div>
              )}
              {anyPhysical && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ডেলিভারি ({region === "DHAKA" ? "ঢাকার ভেতরে" : "ঢাকার বাহিরে"})</span>
                  <span className="font-semibold text-foreground">{formatBdt(deliveryCharge)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display text-xl font-extrabold text-foreground">{formatBdt(total)}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className={cn(inputCls, "py-2.5 uppercase")}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponBusy || !coupon.trim()}
                  className="shrink-0 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
                >
                  {couponBusy ? "…" : "Apply"}
                </button>
              </div>
              {couponMsg && (
                <p className={cn("mt-1.5 text-xs font-semibold", applied ? "text-success" : "text-danger")}>{couponMsg}</p>
              )}
              {applied?.description && <p className="mt-0.5 text-xs text-muted-foreground">{applied.description}</p>}
            </div>
          </div>

          {/* Checkout form */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            {!loggedIn && (
              <p className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                গেস্ট চেকআউট — <a href="/login" className="font-bold text-accent hover:underline">লগইন</a> করলে এই অর্ডার আপনার একাউন্টে যুক্ত হয়ে যাবে।
              </p>
            )}

            <div className="mt-3 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার সম্পূর্ণ নাম লিখুন *" className={inputCls} />
              <div className={cn("grid gap-3", anyDigital ? "grid-cols-2" : "grid-cols-1")}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="মোবাইল নম্বর *" className={inputCls} />
                {anyDigital && (
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Gmail address *" className={inputCls} />
                )}
              </div>
            </div>

            {anyPhysical && (
              <div className="mt-3 space-y-3">
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="আপনার সম্পূর্ণ ঠিকানা *" className={cn(inputCls, "resize-y")} />
                <div className="grid grid-cols-2 gap-2">
                  {(["OUTSIDE", "DHAKA"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegion(r)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors",
                        region === r ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {r === "OUTSIDE" ? `ঢাকার বাহিরে (${formatBdt(settings.deliveryChargeOutside)})` : `ঢাকার ভেতরে (${formatBdt(settings.deliveryChargeDhaka)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {total > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method</p>
                <div className={cn("grid gap-2", allowedMethods.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {allowedMethods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors",
                        activeMethod === m ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m === "COD" ? "Cash on Delivery" : "SSLCOMMERZ"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-xs font-semibold text-danger">{error}</p>}

            <button
              type="button"
              onClick={checkout}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {busy ? "Processing…" : total === 0 ? "Place order" : activeMethod === "COD" ? `Place order — ${formatBdt(total)}` : `Pay ${formatBdt(total)}`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
