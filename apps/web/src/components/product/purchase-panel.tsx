"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";
import { PurchaseDialog } from "./purchase-dialog";

export type PurchasePlan = { id: string; label: string; price: number; originalPrice?: number; note?: string; allowedPaymentMethods?: string[] };

export function PurchasePanel({
  kind = "Course",
  title,
  productId,
  productType,
  allowedPaymentMethods,
  plans,
  planNote,
  features,
}: {
  kind?: "Course" | "Book" | "Exam";
  title: string;
  productId: string;
  productType: "course" | "book" | "exam";
  allowedPaymentMethods?: string[];
  plans: PurchasePlan[];
  planNote?: string;
  features: string[];
}) {
  const [active, setActive] = useState(plans[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [showBar, setShowBar] = useState(false);

  const plan = plans.find((p) => p.id === active) ?? plans[0];

  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden rounded-3xl border border-border bg-card p-6 shadow-card lg:block">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-3xl font-extrabold text-foreground">{formatBdt(plan.price)}</span>
          {plan.originalPrice && plan.originalPrice > plan.price ? (
            <span className="text-sm text-muted-foreground line-through">{formatBdt(plan.originalPrice)}</span>
          ) : null}
        </div>
        {planNote && <p className="mt-1 text-xs text-muted-foreground">{planNote}</p>}

        <div className="mt-5 space-y-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                active === p.id ? "border-accent bg-accent/10" : "border-border bg-card hover:border-muted-foreground/40",
              )}
            >
              <span>
                <span className={cn("block text-sm font-bold", active === p.id ? "text-accent" : "text-foreground")}>{p.label}</span>
                {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
              </span>
              <span className="text-sm font-bold text-foreground">{formatBdt(p.price)}</span>
            </button>
          ))}
        </div>

        <Button className="mt-5 w-full" variant="accent" size="lg" onClick={() => setOpen(true)}>
          {plan.price === 0 ? "Start Free" : kind === "Book" ? "এক্ষুনি অর্ডার করুন" : "Enroll Now"}
        </Button>
        {plan.originalPrice && plan.originalPrice > plan.price ? (
          <p className="mt-2 text-center text-xs font-semibold text-accent">
            Save {formatBdt(plan.originalPrice - plan.price)} today
          </p>
        ) : null}

        <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <IconCheck width={15} height={15} className="mt-0.5 shrink-0 text-success" />
              {f}
            </li>
          ))}
        </ul>

      </div>

      {/* Mobile sticky bottom bar */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/90 p-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-2">
            <div>
              <p className="text-xs text-muted-foreground">{plan.label}</p>
              <p className="font-display text-lg font-extrabold text-foreground">
                {formatBdt(plan.price)}
                {plan.originalPrice && plan.originalPrice > plan.price ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground line-through">{formatBdt(plan.originalPrice)}</span>
                ) : null}
              </p>
            </div>
            <Button variant="accent" onClick={() => setOpen(true)} className="px-6">
              {plan.price === 0 ? "Start Free" : kind === "Book" ? "এক্ষুনি অর্ডার করুন" : "Enroll Now"}
            </Button>
          </div>
        </div>
      )}

      <PurchaseDialog
        key={open ? "checkout-open" : "checkout-closed"}
        open={open}
        onClose={() => setOpen(false)}
        kind={kind}
        title={title}
        productId={productId}
        productType={productType}
        allowedPaymentMethods={plan.allowedPaymentMethods ?? allowedPaymentMethods}
        planId={plan.id}
        planLabel={plan.label}
        price={plan.price}
        originalPrice={plan.originalPrice ?? 0}
        note=""
      />
    </>
  );
}