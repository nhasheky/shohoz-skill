"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/format";
import { cleanPhoneInput, isValidPhone } from "@/lib/phone";
import { useCheckoutDraft } from "@/hooks/use-checkout-draft";
import { IconCheckCircle, IconLock, IconShieldCheck } from "@/components/ui/icons";
import { ProductCover } from "@/components/ui/product-cover";
import type { PurchasePlan } from "./purchase-panel";

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

export function BookOrderForm({
  title,
  productId,
  thumbnailUrl,
  allowedPaymentMethods,
  plans,
}: {
  title: string;
  productId: string;
  thumbnailUrl?: string;
  allowedPaymentMethods?: string[];
  plans: PurchasePlan[];
}) {
  const router = useRouter();
  const [active, setActive] = useState(plans[0]?.id ?? "");
  const [step, setStep] = useState<"form" | "processing" | "error" | "done">("form");
  const [method, setMethod] = useState<PaymentMethod>("SSLCOMMERZ");
  const [name, setName] = useState(() => readStoredUser()?.name ?? "");
  const [phone, setPhone] = useState(() => readStoredUser()?.phone?.replace(/^\+88/, "") ?? "");
  const [email, setEmail] = useState(() => readStoredUser()?.email ?? "");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<Region>("OUTSIDE");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loggedIn] = useState(() => hasStoredToken());
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const plan = plans.find((p) => p.id === active) ?? plans[0];
  const price = plan?.price ?? 0;
  const free = price === 0;
  const physical = plan?.id === "hardcopy";

  const deliveryCharge = physical
    ? region === "DHAKA"
      ? settings.deliveryChargeDhaka
      : settings.deliveryChargeOutside
    : 0;
  const couponDiscount = applied?.discount ?? 0;
  const total = Math.max(0, price - couponDiscount) + deliveryCharge;
  const discount = plan?.originalPrice && plan.originalPrice > price
    ? Math.round(((plan.originalPrice - price) / plan.originalPrice) * 100)
    : 0;

  const allowed = useMemo<PaymentMethod[]>(() => {
    const defaults: PaymentMethod[] = physical ? ["COD", "SSLCOMMERZ"] : ["SSLCOMMERZ"];
    const configured = allowedPaymentMethods?.length ? (allowedPaymentMethods as PaymentMethod[]) : defaults;
    return configured.filter((m) =>
      m === "COD" ? physical && settings.codEnabled : m === "SSLCOMMERZ" ? settings.sslcommerzEnabled : false,
    );
  }, [allowedPaymentMethods, physical, settings.codEnabled, settings.sslcommerzEnabled]);

  const activeMethod: PaymentMethod = allowed.includes(method) ? method : (allowed[0] ?? "SSLCOMMERZ");

  const draftRef = useCheckoutDraft(step === "form", () => ({
    name,
    phone,
    email,
    address,
    region,
    paymentMethod: activeMethod,
    note: title,
    items: [
      {
        productType: "book",
        productId,
        variant: plan?.id,
        title,
        unitPrice: price,
        quantity: 1,
      },
    ],
  }));

  useEffect(() => {
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
  }, []);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    setCouponMsg("");
    try {
      const item: Record<string, unknown> = { productType: "book", productId, quantity: 1 };
      if (plan) item.variant = plan.id;
      const res = await fetch(`${API_URL}/api/orders/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim(), items: [item] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message || "Invalid coupon.");
      setApplied({ code: data.code, discount: data.discount });
      setCouponMsg(`প্রযোজ্য — সাশ্রয় ${formatBdt(data.discount)}`);
    } catch (e) {
      setApplied(null);
      setCouponMsg(e instanceof Error ? e.message : "Invalid coupon.");
    } finally {
      setCouponBusy(false);
    }
  }

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

  async function submit() {
    const problem = validate();
    if (problem) {
      setErrorMsg(problem);
      setStep("error");
      return;
    }
    setStep("processing");
    setErrorMsg("");

    const body: Record<string, unknown> = {
      productType: "book",
      productId,
      paymentMethod: free ? "SSLCOMMERZ" : activeMethod,
      variant: plan?.id,
    };
    if (draftRef.current) body.draftId = draftRef.current;
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
      if (data.status === "PAID" || activeMethod === "COD") {
        setStep("done");
        goToSuccess(data.orderId, data.status === "PAID" ? "PAID" : "PENDING");
        return;
      }
      if (activeMethod === "SSLCOMMERZ" && data.paymentUrl) {
        window.location.assign(data.paymentUrl);
        return;
      }
      goToSuccess(data.orderId, "PENDING");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setStep("error");
    }
  }

  function goToSuccess(id: string, status: string) {
    const q = new URLSearchParams({
      orderId: id,
      method: free ? "FREE" : activeMethod,
      status,
      digital: physical ? "0" : "1",
    });
    router.push(`/checkout/success?${q.toString()}`);
  }

  if (step === "done") {
    return (
      <div className="rounded-3xl border border-success/30 bg-success/5 p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <IconCheckCircle width={30} height={30} />
        </div>
        <p className="mt-4 font-display text-xl font-extrabold text-foreground">অর্ডার সম্পন্ন হয়েছে!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Order ID: <span className="font-mono text-foreground">{orderId}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="border-b border-border bg-muted/50 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">অর্ডার ফর্ম</p>
        <h2 className="mt-0.5 font-display text-xl font-extrabold text-foreground">{title}</h2>
      </div>

      <div className="space-y-6 p-6">
        {/* 1. Book photo + quantity + price */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-3">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={title} className="h-20 w-16 shrink-0 rounded-lg border border-border object-cover" />
          ) : (
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
              <ProductCover title={title} kind="book" ratio="portrait" compact />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{plan?.label || (physical ? "হার্ডকপি" : "PDF কপি")}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">পরিমাণ: ১</span>
              <span className="font-display text-lg font-extrabold text-foreground">
                {formatBdt(price)}
                {discount > 0 && (
                  <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{discount}% off</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {plans.length > 1 && (
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">ফরম্যাট বাছুন</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    active === p.id ? "border-accent bg-accent/10" : "border-border bg-card hover:border-muted-foreground/40",
                  )}
                >
                  <span className={cn("text-sm font-bold", active === p.id ? "text-accent" : "text-foreground")}>
                    {p.label || (p.id === "hardcopy" ? "হার্ডকপি" : "PDF কপি")}
                  </span>
                  <span className="text-sm font-bold text-foreground">{formatBdt(p.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Customer details */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground">আপনার তথ্য</p>
          {!loggedIn && (
            <p className="text-xs text-muted-foreground">
              গেস্ট হিসেবে অর্ডার করুন — বা{" "}
              <a href="/login" className="font-bold text-accent hover:underline">লগইন</a> করলে এই অর্ডার আপনার একাউন্টে যুক্ত হবে।
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">আপনার সম্পূর্ণ নাম লিখুন *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: রহিম উদ্দিন" className={inputCls} />
          </label>
          <div className={cn("grid gap-3", physical ? "grid-cols-1" : "sm:grid-cols-2")}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">মোবাইল নম্বর *</span>
              <input value={phone} onChange={(e) => setPhone(cleanPhoneInput(e.target.value))} inputMode="tel" placeholder="01XXXXXXXXX" className={inputCls} />
            </label>
            {!physical && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Gmail address *</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@gmail.com" className={inputCls} />
              </label>
            )}
          </div>
          {physical && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">আপনার সম্পূর্ণ ঠিকানা *</span>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="বাসা, রোড, এলাকা, জেলা" className={cn(inputCls, "resize-y")} />
            </label>
          )}
        </div>

        {/* 3. Shipping */}
        {physical && (
          <div>
            <p className="mb-2 text-sm font-bold text-foreground">শিপিং</p>
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

        {!free && (
          <div>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="কুপন কোড"
                className={cn(inputCls, "py-2.5 uppercase")}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponBusy || !coupon.trim()}
                className="shrink-0 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
              >
                {couponBusy ? "…" : "প্রয়োগ"}
              </button>
            </div>
            {couponMsg && <p className={cn("mt-1.5 text-xs font-semibold", applied ? "text-success" : "text-danger")}>{couponMsg}</p>}
          </div>
        )}

        {/* 4. Order summary */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">অর্ডার সারসংক্ষেপ</p>
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{plan?.label || (physical ? "হার্ডকপি" : "PDF কপি")} × ১</span>
              <span className="font-semibold text-foreground">{formatBdt(price)}</span>
            </div>
            {physical && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ডেলিভারি ({region === "DHAKA" ? "ঢাকার ভেতরে" : "ঢাকার বাহিরে"})</span>
                <span className="font-semibold text-foreground">{formatBdt(deliveryCharge)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-success">
                <span>কুপন ({applied?.code})</span>
                <span className="font-semibold">− {formatBdt(couponDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2.5">
              <span className="font-bold text-foreground">সর্বমোট</span>
              <span className="font-display text-2xl font-extrabold text-foreground">{formatBdt(total)}</span>
            </div>
          </div>
        </div>

        {/* 5. Payment method */}
        {!free && (
          <div>
            <p className="mb-2 text-sm font-bold text-foreground">পেমেন্ট পদ্ধতি</p>
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
                  {m === "COD" ? "ক্যাশ অন ডেলিভারি" : "SSLCOMMERZ দিয়ে পেমেন্ট"}
                </button>
              ))}
            </div>
            {physical && activeMethod === "COD" && (
              <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-foreground">
                অনুগ্রহ করে ফেক অর্ডার করবেন না। আমরা আপনাদের বিশ্বাস করেই বই পাঠাই অগ্রিম, আপনি ক্যান্সেল করলে আমাদের লস হয়। অনুগ্রহ করে ফেক অর্ডার করবেন না।
              </p>
            )}
          </div>
        )}

        {/* 6. Confirm button */}
        <button
          type="button"
          onClick={submit}
          disabled={step === "processing"}
          className="w-full rounded-2xl bg-accent px-6 py-4 font-display text-base font-extrabold text-accent-foreground shadow-glow transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {step === "processing" ? "অর্ডার প্রসেস হচ্ছে…" : "এখানে ক্লিক দিয়ে অর্ডার কনফার্ম করুন"}
        </button>

        {step === "error" && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-center text-sm font-semibold text-danger">{errorMsg}</p>
        )}

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <IconShieldCheck width={14} height={14} className="text-success" />
          নিরাপদ পেমেন্ট — SSLCOMMERZ ও ক্যাশ অন ডেলিভারি
        </p>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <IconLock width={13} height={13} /> আপনার তথ্য সুরক্ষিত। অর্ডার দিলে আমাদের টিম শীঘ্রই যোগাযোগ করবে।
        </p>
      </div>
    </div>
  );
}
