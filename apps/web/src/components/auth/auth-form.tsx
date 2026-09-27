"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  IconCheckCircle,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconMail,
  IconPhone,
  IconUser,
} from "@/components/ui/icons";

/* ───────────────────────── helpers ──────────────────────────── */
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRx = /^01\d{9}$/;

function validatePhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return phoneRx.test(digits)
    ? ""
    : "সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)।";
}
function validateEmail(v: string) {
  return emailRx.test(v.trim()) ? "" : "সঠিক ইমেইল অ্যাড্রেস দিন।";
}
function validatePassword(v: string) {
  return v.length >= 6 ? "" : "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
}

/* ────────────────────────── component ──────────────────────── */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();

  /* shared state */
  const [step, setStep] = useState<"form" | "otp">("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /* register fields */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  /* login field — accepts either email or phone */
  const [loginId, setLoginId] = useState("");

  /* otp */
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  /* masking helpers */
  const maskedPhone =
    phone.length >= 6
      ? phone.slice(0, 4) + "****" + phone.slice(-3)
      : phone;
  const maskedEmail =
    email.length > 4
      ? email.slice(0, 3) + "****" + email.slice(email.indexOf("@"))
      : email;

  const inputCls =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

  /* ──────── register submit ──────── */
  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("আপনার নাম লিখুন।"); return; }
    const pErr = validatePhone(phone);
    if (pErr) { setError(pErr); return; }
    const eErr = validateEmail(email);
    if (eErr) { setError(eErr); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setError("");
    setBusy(true);
    // TODO: POST /api/auth/register { name, phone, email, password }
    setTimeout(() => {
      setBusy(false);
      setStep("otp"); // go to OTP verification
    }, 700);
  }

  /* ──────── login submit ──────── */
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const id = loginId.trim();
    if (!id) { setError("ইমেইল অথবা মোবাইল নম্বর দিন।"); return; }
    const isEmail = emailRx.test(id);
    const isPhone = phoneRx.test(id.replace(/\D/g, ""));
    if (!isEmail && !isPhone) {
      setError("সঠিক ইমেইল অথবা ১১-সংখ্যার মোবাইল নম্বর দিন।");
      return;
    }
    if (!password) { setError("পাসওয়ার্ড দিন।"); return; }

    setError("");
    setBusy(true);
    // TODO: POST /api/auth/login { identifier: id, password }
    setTimeout(() => {
      setBusy(false);
      router.push("/dashboard");
    }, 800);
  }

  /* ──────── OTP verify ──────── */
  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.replace(/\D/g, "").length < 4) {
      setError("৪-৬ সংখ্যার ভেরিফিকেশন কোড দিন।");
      return;
    }
    setBusy(true);
    // TODO: POST /api/auth/verify-otp { phone, email, otp }
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  }

  /* ────────────────────── OTP STEP (after register) ───────── */
  if (step === "otp") {
    return (
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <IconCheckCircle width={20} height={20} />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">ভেরিফিকেশন</h2>
            <p className="text-xs text-muted-foreground">আপনার ইমেইল ও মোবাইলে কোড পাঠানো হয়েছে</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-accent/5 p-3 text-xs text-muted-foreground space-y-1">
          <p>📱 SMS পাঠানো হয়েছে: <span className="font-bold text-foreground">{maskedPhone}</span></p>
          <p>📧 ইমেইল পাঠানো হয়েছে: <span className="font-bold text-foreground">{maskedEmail}</span></p>
          <p className="text-accent font-semibold">যেকোনো একটি থেকে কোড দিলেই হবে!</p>
        </div>

        <form onSubmit={handleVerify} className="mt-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">ভেরিফিকেশন কোড</span>
            <div className="relative">
              <IconKey width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                placeholder="••••••"
                type={showOtp ? "text" : "password"}
                className={`${inputCls} pl-11 pr-11`}
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

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={busy}>
            {busy ? "ভেরিফাই হচ্ছে…" : "ভেরিফাই করুন ও লগইন হন"}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            কোড আসেনি?{" "}
            <button type="button" className="font-bold text-accent hover:underline">
              আবার পাঠান
            </button>
          </p>

          <button
            type="button"
            onClick={() => { setStep("form"); setOtp(""); setError(""); }}
            className="mt-2 w-full text-center text-xs font-bold text-accent hover:underline"
          >
            ← তথ্য পরিবর্তন করুন
          </button>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-xs text-muted-foreground">
            <IconCheckCircle width={14} height={14} className="mt-0.5 shrink-0 text-success" />
            ডেমো মোড: যেকোনো ৪+ সংখ্যার কোড দিলেই কাজ করবে।
          </div>
        </form>
      </div>
    );
  }

  /* ──────────────── REGISTER FORM ─────────────── */
  if (mode === "register") {
    return (
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconUser width={18} height={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">একাউন্ট তৈরি করুন</h2>
            <p className="text-xs text-muted-foreground">১ মিনিটেরও কম সময় লাগবে</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          {/* Name */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">আপনার নাম</span>
            <div className="relative">
              <IconUser width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="পূর্ণ নাম লিখুন"
                className={`${inputCls} pl-11`}
                autoComplete="name"
              />
            </div>
          </label>

          {/* Mobile */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">মোবাইল নম্বর</span>
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

          {/* Email */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">ইমেইল অ্যাড্রেস</span>
            <div className="relative">
              <IconMail width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="example@gmail.com"
                className={`${inputCls} pl-11`}
                autoComplete="email"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">পাসওয়ার্ড</span>
            <div className="relative">
              <IconLock width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? "text" : "password"}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className={`${inputCls} pl-11 pr-11`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showPwd ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
              </button>
            </div>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy}>
            {busy ? "তৈরি হচ্ছে…" : "একাউন্ট তৈরি করুন"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            আগে থেকে একাউন্ট আছে?{" "}
            <a href="/login" className="font-bold text-accent hover:underline">
              লগইন করুন
            </a>
          </p>
        </form>
      </div>
    );
  }

  /* ──────────────── LOGIN FORM ─────────────── */
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconKey width={18} height={18} />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">স্বাগতম</h2>
          <p className="text-xs text-muted-foreground">ইমেইল বা মোবাইল নম্বর দিয়ে লগইন করুন</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        {/* Email or Phone */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">ইমেইল বা মোবাইল নম্বর</span>
          <div className="relative">
            <IconMail width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="example@gmail.com অথবা 01XXXXXXXXX"
              className={`${inputCls} pl-11`}
              autoComplete="username"
            />
          </div>
        </label>

        {/* Password */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">পাসওয়ার্ড</span>
          <div className="relative">
            <IconLock width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPwd ? "text" : "password"}
              placeholder="আপনার পাসওয়ার্ড"
              className={`${inputCls} pl-11 pr-11`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle password visibility"
            >
              {showPwd ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <a href="#" className="text-xs font-semibold text-accent hover:underline">পাসওয়ার্ড ভুলে গেছেন?</a>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy}>
          {busy ? "লগইন হচ্ছে…" : "লগইন করুন"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          একাউন্ট নেই?{" "}
          <a href="/register" className="font-bold text-accent hover:underline">
            একাউন্ট তৈরি করুন
          </a>
        </p>
      </form>
    </div>
  );
}