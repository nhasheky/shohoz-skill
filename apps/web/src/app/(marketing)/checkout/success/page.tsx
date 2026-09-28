"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BackgroundOrbs } from "@/components/layout/background";
import { ButtonLink } from "@/components/ui/button";
import { IconCheckCircle, IconLock, IconWallet } from "@/components/ui/icons";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "";
  const method = params.get("method") ?? "";
  const status = params.get("status") ?? "PENDING";
  const digital = params.get("digital") === "1";

  return (
    <main className="relative overflow-hidden">
      <BackgroundOrbs />
      <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <IconCheckCircle width={32} height={32} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold text-foreground">
            {method === "COD" ? "Order confirmed!" : status === "PAID" ? "Payment successful!" : "Order placed!"}
          </h1>
          {orderId && (
            <p className="mt-2 text-sm text-muted-foreground">
              Order ID: <span className="font-mono text-foreground">{orderId}</span>
            </p>
          )}

          {method === "COD" ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <IconWallet width={16} height={16} className="text-accent" />
              Pay cash to the courier when your book is delivered.
            </p>
          ) : status === "PENDING" ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Your payment is being confirmed. Access unlocks as soon as the gateway settles.
            </p>
          ) : null}

          {digital && (
            <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-left">
              <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
                <IconLock width={16} height={16} className="mt-0.5 shrink-0 text-accent" />
                To access your digital courses/exams, please login or create an account using the phone/email you just provided.
              </p>
              <p className="mt-2 pl-6 text-xs text-muted-foreground">
                Your purchase is linked to that phone/email — signing in with the same details automatically unlocks it.
              </p>
              <div className="mt-4 flex flex-col gap-2 pl-6 sm:flex-row">
                <ButtonLink href="/login" variant="accent">Login</ButtonLink>
                <ButtonLink href="/register" variant="outline">Create account</ButtonLink>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/" variant="outline">Back to home</ButtonLink>
            <ButtonLink href="/dashboard" variant="accent">Go to dashboard</ButtonLink>
          </div>
        </div>
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
