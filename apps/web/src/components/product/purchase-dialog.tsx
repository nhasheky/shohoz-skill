"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconLock, IconRefresh, IconShieldCheck, IconWallet, IconX } from "@/components/ui/icons";

type Step = "form" | "processing" | "success" | "error";
type Method = "bkash" | "nagad" | "rocket" | "card";

const METHODS: { id: Method; label: string }[] = [
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "rocket", label: "Rocket" },
  { id: "card", label: "Card" },
];

export function PurchaseDialog({
  open,
  onClose,
  kind = "Course",
  title,
  planLabel,
  price,
  originalPrice = 0,
  note,
}: {
  open: boolean;
  onClose: () => void;
  kind?: "Course" | "Book" | "Exam";
  title: string;
  planLabel: string;
  price: number;
  originalPrice?: number;
  note: string;
}) {
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<Method>("bkash");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const free = price === 0;

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const discount = useMemo(() => (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0), [price, originalPrice]);

  if (!open) return null;

  function startPoll() {
    setStep("processing");
    setErrorMsg("");
    let tick = 0;
    const run = () => {
      tick += 1;
      if (tick > 4) {
        const success = Math.random() > 0.08;
        if (success) {
          setOrderId(`SS-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`);
          setStep("success");
        } else {
          setErrorMsg("The payment gateway timed out. No money was deducted — please retry.");
          setStep("error");
        }
        return;
      }
      timer.current = setTimeout(run, 850);
    };
    timer.current = setTimeout(run, 600);
  }

  function handlePay() {
    if (!free && (method === "bkash" || method === "nagad" || method === "rocket") && phone.replace(/\D/g, "").length < 11) {
      setErrorMsg("Enter a valid 11-digit Bangladeshi mobile number.");
      setStep("error");
      return;
    }
    if (free) {
      setOrderId(`SS-FREE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
      setStep("success");
      return;
    }
    startPoll();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
      onClick={step === "processing" ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-card shadow-pop p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{kind} · Checkout</p>
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
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-muted/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-display text-xl font-extrabold text-foreground">
                {formatBdt(price)}
                {discount > 0 && (
                  <span className="ml-2 align-middle rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{discount}% off</span>
                )}
              </span>
            </div>

            {!free && (
              <>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors",
                          method === m.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {method === "card" ? "Card number" : `Your ${METHODS.find((m) => m.id === method)?.label} number`}
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode={method === "card" ? "numeric" : "tel"}
                    placeholder={method === "card" ? "XXXX XXXX XXXX XXXX" : "01XXXXXXXXX"}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent"
                  />
                </label>
                {method !== "card" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    You will receive a {METHODS.find((m) => m.id === method)?.label} payment request on this number.
                  </p>
                )}
              </>
            )}

            <Button className="mt-5 w-full" variant="accent" size="lg" onClick={handlePay}>
              <IconWallet width={17} height={17} className="mr-2" />
              {free ? "Enroll Free" : `Pay ${formatBdt(price)}`}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <IconShieldCheck width={14} height={14} className="text-success" />
              Secure mock checkout — no real money moves during preview.
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <IconLock width={13} height={13} /> {note}
            </p>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
            </div>
            <p className="mt-5 font-display font-bold text-foreground">Verifying payment…</p>
            <p className="mt-1 max-w-[26ch] text-sm text-muted-foreground">
              Polling the gateway in the background. This usually takes a few seconds.
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-2xl text-danger">!</div>
            <p className="mt-4 font-display font-bold text-foreground">Payment was not completed</p>
            <p className="mx-auto mt-1 max-w-[30ch] text-sm text-danger">{errorMsg}</p>
            <button
              type="button"
              onClick={startPoll}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
            >
              <IconRefresh width={15} height={15} /> Retry payment
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <IconCheckCircle width={30} height={30} />
            </div>
            <p className="mt-4 font-display text-xl font-extrabold text-foreground">Payment successful!</p>
            <p className="mt-1 text-sm text-muted-foreground">Order ID: <span className="font-mono text-foreground">{orderId}</span></p>
            <p className="mt-3 text-xs text-muted-foreground">Access unlocks instantly on this device. Full device-limit + account sync arrives with the API.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Keep browsing
              </Button>
              <Button
                variant="accent"
                className="flex-1"
                onClick={() => {
                  onClose();
                  router.push("/dashboard");
                }}
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}