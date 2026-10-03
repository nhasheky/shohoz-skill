"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconLock, IconRefresh, IconShieldCheck, IconX } from "@/components/ui/icons";
import { cleanPhoneInput, isValidPhone } from "@/lib/phone";
import { useCheckoutDraft } from "@/hooks/use-checkout-draft";

type Step = "form" | "processing" | "success" | "error";
type PaymentMethod = "COD" | "SSLCOMMERZ";
type Region = "DHAKA" | "OUTSIDE";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

type Settings = {
  deliveryChargeDhaka: number;
  deliveryChargeOutside: number;
  codEnabled: boolean;
  sslcommerzEnabled: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  deliveryChargeDhaka: 60,
  deliveryChargeOutside: 120,
  codEnabled: true,
  sslcommerzEnabled: true,
};

const inputCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

function readStoredUser(): { name?: string; phone?: string; email?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("shohoz_user");
    return raw ? (JSON.parse(raw) as { name?: string; phone?: string; email?: string }) : null;
  } catch {
    return null;
  }
}

function hasStoredToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("shohoz_token"));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PurchaseDialog({
  open,
  onClose,
  kind = "Course",
  title,
  productId,
  productType,
  allowedPaymentMethods,
  planId,
  planLabel,
  price,
  originalPrice = 0,
  note,
}: {
  open: boolean;
  onClose: () => void;
  kind?: "Course" | "Book" | "Exam";
  title: string;
  productId: string;
  productType: "course" | "book" | "exam";
  allowedPaymentMethods?: string[];
  planId: string;
  planLabel: string;
  price: number;
  originalPrice?: number;
  note: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<PaymentMethod>("SSLCOMMERZ");
  const [name, setName] = useState(() => readStoredUser()?.name ?? "");
  const [phone, setPhone] = useState(() => readStoredUser()?.phone?.replace(/^\+88/, "") ?? "");
  const [email, setEmail] = useState(() => readStoredUser()?.email ?? "");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<Region>("OUTSIDE");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loggedIn] = useState(() => hasStoredToken());
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const free = price === 0;
  const physical = productType === "book" && planId === "hardcopy";

  const deliveryCharge = physical
    ? region === "DHAKA"
      ? settings.deliveryChargeDhaka
      : settings.deliveryChargeOutside
    : 0;
  const couponDiscount = applied?.discount ?? 0;
  const total = Math.max(0, price - couponDiscount) + deliveryCharge;

  const draftRef = useCheckoutDraft(open, () => ({
    name,
    phone,
    email,
    address,
    region,
    paymentMethod: activeMethod,
    note: title,
    items: [
      {
        productType,
        productId,
        variant: productType === "book" ? planId : undefined,
        duration: productType === "course" ? planId : undefined,
        title,
        unitPrice: price,
        quantity: 1,
      },
    ],
  }));

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    setCouponMsg("");
    try {
      const item: Record<string, unknown> = { productType, productId, quantity: 1 };
      if (productType === "book") item.variant = planId;
      if (productType === "course") item.duration = planId;
      const res = await fetch(`${API_URL}/api/orders/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim(), items: [item] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message || "Invalid coupon.");
      setApplied({ code: data.code, discount: data.discount });
      setCouponMsg(`Applied — you save ${formatBdt(data.discount)}`);
    } catch (e) {
      setApplied(null);
      setCouponMsg(e instanceof Error ? e.message : "Invalid coupon.");
    } finally {
      setCouponBusy(false);
    }
  }

  const allowed = useMemo<PaymentMethod[]>(() => {
    const defaults: PaymentMethod[] = physical ? ["COD", "SSLCOMMERZ"] : ["SSLCOMMERZ"];
    const configured = allowedPaymentMethods?.length ? (allowedPaymentMethods as PaymentMethod[]) : defaults;
    return configured.filter((m) =>
      m === "COD" ? physical && settings.codEnabled : m === "SSLCOMMERZ" ? settings.sslcommerzEnabled : false,
    );
  }, [allowedPaymentMethods, physical, settings.codEnabled, settings.sslcommerzEnabled]);

  const activeMethod: PaymentMethod = allowed.includes(method) ? method : (allowed[0] ?? "SSLCOMMERZ");

  const discount = useMemo(
    () => (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
    [price, originalPrice],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/site-settings`, { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const s = (await res.json()) as Partial<Settings>;
        if (!cancelled) {
          setSettings({
            deliveryChargeDhaka: s.deliveryChargeDhaka ?? DEFAULT_SETTINGS.deliveryChargeDhaka,
            deliveryChargeOutside: s.deliveryChargeOutside ?? DEFAULT_SETTINGS.deliveryChargeOutside,
            codEnabled: s.codEnabled ?? true,
            sslcommerzEnabled: s.sslcommerzEnabled ?? true,
          });
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function authHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("shohoz_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function validate(): string {
    if (!name.trim()) return "আপনার সম্পূর্ণ নাম লিখুন।";
    if (!isValidPhone(phone)) return "সঠিক মোবাইল নম্বর দিন (অন্তত ১১ ডিজিট, কান্ট্রি কোডসহ দিতে পারেন)।";
    if (physical) {
      if (!address.trim()) return "আপনার সম্পূর্ণ ঠিকানা লিখুন।";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "সঠিক Gmail / ইমেইল অ্যাড্রেস দিন।";
    }
    return "";
  }

  async function pay() {
    const problem = validate();
    if (problem) {
      setErrorMsg(problem);
      setStep("error");
      return;
    }
    setStep("processing");
    setErrorMsg("");

    const body: Record<string, unknown> = {
      productType,
      productId,
      paymentMethod: free ? "SSLCOMMERZ" : activeMethod,
    };
    if (draftRef.current) body.draftId = draftRef.current;
    if (productType === "book") body.variant = planId;
    if (productType === "course") body.duration = planId;
    if (!loggedIn) {
      body.guestName = name.trim();
      body.guestPhone = phone.replace(/\D/g, "");
      if (email.trim()) body.guestEmail = email.trim().toLowerCase();
    }
    if (physical) {
      body.address = address.trim();
      body.region = region;
    }
    if (applied?.code) body.couponCode = applied.code;

    try {
      const res = await fetch(`${API_URL}/api/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { orderId: string; status: string; paymentUrl?: string | null; message?: string };
      if (!res.ok) throw new Error((data as { message?: string }).message || `Checkout failed (${res.status})`);

      setOrderId(data.orderId);

      if (data.status === "PAID") {
        goToSuccess(data.orderId, "PAID");
        return;
      }
      if (activeMethod === "COD") {
        goToSuccess(data.orderId, "PENDING");
        return;
      }

      if (activeMethod === "SSLCOMMERZ" && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // Fallback for simulation/testing if paymentUrl is not returned
      for (let i = 0; i < 3; i++) {
        await delay(900);
        try {
          const pr = await fetch(`${API_URL}/api/orders/${data.orderId}/poll`, { method: "POST" });
          const pd = (await pr.json()) as { status?: string };
          if (pd.status === "PAID") {
            goToSuccess(data.orderId, "PAID");
            return;
          }
        } catch {
          /* keep polling */
        }
      }
      goToSuccess(data.orderId, "PENDING");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setStep("error");
    }
  }

  function goToSuccess(id: string, status: string) {
    setStep("success");
    const q = new URLSearchParams({
      orderId: id,
      method: free ? "FREE" : method,
      status,
      digital: physical ? "0" : "1",
    });
    onClose();
    router.push(`/checkout/success?${q.toString()}`);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
      onClick={step === "processing" ? undefined : onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-pop sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{kind} - Checkout</p>
            <h2 className="mt-1 font-display text-lg font-bold leading-snug text-foreground">{title}</h2>
            {planLabel !== "Full access" && <p className="mt-0.5 text-sm text-muted-foreground">Plan: {planLabel}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        {step === "form" && (
          <>
            <div className="mt-5 space-y-1.5 rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Item</span>
                <span className="font-semibold text-foreground">
                  {formatBdt(price)}
                  {discount > 0 && (
                    <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{discount}% off</span>
                  )}
                </span>
              </div>
              {physical && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ডেলিভারি ({region === "DHAKA" ? "ঢাকার ভেতরে" : "ঢাকার বাহিরে"})</span>
                  <span className="font-semibold text-foreground">{formatBdt(deliveryCharge)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>Coupon ({applied?.code})</span>
                  <span className="font-semibold">− {formatBdt(couponDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display text-xl font-extrabold text-foreground">{formatBdt(total)}</span>
              </div>
            </div>

            {!free && (
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
                {couponMsg && <p className={cn("mt-1.5 text-xs font-semibold", applied ? "text-success" : "text-danger")}>{couponMsg}</p>}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {!loggedIn && (
                <p className="text-xs text-muted-foreground">
                  Checkout as guest — বা{" "}
                  <a href="/login" className="font-bold text-accent hover:underline">লগইন</a> করলে এই অর্ডার আপনার একাউন্টে যুক্ত হয়ে যাবে।
                </p>
              )}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">আপনার সম্পূর্ণ নাম লিখুন *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: রহিম উদ্দিন" className={inputCls} />
              </label>
              <div className={cn("grid gap-3", physical ? "grid-cols-1" : "sm:grid-cols-2")}>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">মোবাইল নম্বর *</span>
                  <input value={phone} onChange={(e) => setPhone(cleanPhoneInput(e.target.value))} inputMode="tel" placeholder="01XXXXXXXXX / +88..." className={inputCls} />
                </label>
                {!physical && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gmail address *</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@gmail.com" className={inputCls} />
                  </label>
                )}
              </div>
              {physical && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">আপনার সম্পূর্ণ ঠিকানা *</span>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="বাসা, রোড, এলাকা, জেলা" className={cn(inputCls, "resize-y")} />
                  </label>
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">ডেলিভারি এরিয়া *</span>
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
                </>
              )}
            </div>

            {!free && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method</p>
                <div className={cn("grid gap-2", allowed.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {allowed.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors",
                        activeMethod === m ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m === "COD" ? "Cash on Delivery" : "Pay with SSLCOMMERZ"}
                    </button>
                  ))}
                </div>
                {!physical && (
                  <p className="mt-2 text-xs text-muted-foreground">Digital products are delivered instantly — card, bKash &amp; mobile banking via SSLCOMMERZ.</p>
                )}
                {physical && activeMethod === "COD" && (
                  <p className="mt-2 text-xs text-muted-foreground">Pay the courier in cash when your book arrives.</p>
                )}
              </div>
            )}

            <Button className="mt-5 w-full" variant="accent" size="lg" onClick={pay}>
              {free ? "Enroll Free" : activeMethod === "COD" ? `Place order - ${formatBdt(total)}` : `Pay ${formatBdt(total)}`}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <IconShieldCheck width={14} height={14} className="text-success" />
              Secure checkout — SSLCOMMERZ &amp; Cash on Delivery
            </p>
            {note && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <IconLock width={13} height={13} /> {note}
              </p>
            )}
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
            </div>
            <p className="mt-5 font-display font-bold text-foreground">Processing…</p>
            <p className="mt-1 max-w-[26ch] text-sm text-muted-foreground">
              {activeMethod === "COD" ? "Placing your order." : "Contacting the payment gateway. This takes a few seconds."}
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-2xl text-danger">!</div>
            <p className="mt-4 font-display font-bold text-foreground">We couldn&apos;t complete this</p>
            <p className="mx-auto mt-1 max-w-[30ch] text-sm text-danger">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
            >
              <IconRefresh width={15} height={15} /> Try again
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <IconCheckCircle width={30} height={30} />
            </div>
            <p className="mt-4 font-display text-xl font-extrabold text-foreground">Order placed!</p>
            <p className="mt-1 text-sm text-muted-foreground">Order ID: <span className="font-mono text-foreground">{orderId}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
