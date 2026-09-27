"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconEye, IconEyeOff, IconKey, IconPhone, IconUser } from "@/components/ui/icons";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 11) {
      setError("Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }
    setError("");
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("otp");
    }, 700);
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.replace(/\D/g, "").length < 4) {
      setError("Enter the 4-6 digit code we sent.");
      return;
    }
    setSending(true);
    // Mock: any 4+ digit code works. Real flow: POST /api/auth/otp/verify → JWT.
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {mode === "login" ? <IconKey width={18} height={18} /> : <IconUser width={18} height={18} />}
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-xs text-muted-foreground">{mode === "login" ? "Log in with your mobile number" : "Takes less than a minute"}</p>
        </div>
      </div>

      {step === "phone" ? (
        <form onSubmit={sendOtp} className="mt-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile number</span>
            <div className="relative">
              <IconPhone width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                className={`${inputCls} pl-11`}
                autoComplete="tel"
              />
            </div>
          </label>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={sending}>
            {sending ? "Sending code…" : `Send ${mode === "register" ? "verification" : "login"} code`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {mode === "login"
              ? "No account yet? "
              : "Already registered? "}
            <a href={mode === "login" ? "/register" : "/login"} className="font-bold text-accent hover:underline">
              {mode === "login" ? "Create one" : "Log in"}
            </a>
          </p>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification code</span>
            <div className="relative">
              <IconKey width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                placeholder="••••••"
                type={showOtp ? "text" : "password"}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowOtp((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle code visibility"
              >
                {showOtp ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
              </button>
            </div>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            We sent a code to <span className="font-bold text-foreground">{phone}</span>.{" "}
            <button type="button" onClick={() => setStep("phone")} className="font-bold text-accent hover:underline">
              Change number
            </button>
          </p>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={sending}>
            {sending ? "Verifying…" : mode === "register" ? "Create account & log in" : "Log in"}
          </Button>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-xs text-muted-foreground">
            <IconCheckCircle width={14} height={14} className="mt-0.5 shrink-0 text-success" />
            Demo mode: enter any 4+ digit code to continue. The real flow issues a signed JWT and registers your device for the 2-device limit.
          </div>
        </form>
      )}
    </div>
  );
}