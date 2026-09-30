"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  IconCheckCircle,
  IconCircleX,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconMail,
  IconPhone,
  IconUser,
} from "@/components/ui/icons";

/* ───────────────────────── helpers ──────────────────────────── */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRx = /^01\d{9}$/;

/* ────────────────────────── component ──────────────────────── */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();

  /* shared state */
  const [step, setStep] = useState<"form" | "otp">("form");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
  const [userId, setUserId] = useState("");
  const [resending, setResending] = useState(false);

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
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("আপনার নাম লিখুন।"); return; }
    if (!phoneRx.test(phone.replace(/\D/g, ""))) { setError("সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)।"); return; }
    if (!emailRx.test(email.trim())) { setError("সঠিক ইমেইল অ্যাড্রেস দিন।"); return; }
    if (password.length < 6) { setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"); return; }

    setError("");
    setBusy(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        setBusy(false);
        return;
      }

      setUserId(data.userId);
      setStep("otp");
    } catch {
      setError("সার্ভারে সংযোগ হচ্ছে না। পরে আবার চেষ্টা করুন।");
    }
    setBusy(false);
  }

  /* ──────── login submit ──────── */
  async function handleLogin(e: React.FormEvent) {
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

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "লগইন ব্যর্থ হয়েছে। ইমেইল/মোবাইল ও পাসওয়ার্ড চেক করুন।");
        setBusy(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("shohoz_token", data.accessToken);
      localStorage.setItem("shohoz_user", JSON.stringify(data.user));
      document.cookie = `shohoz_token=${data.accessToken}; path=/; max-age=604800; samesite=lax`;
      router.push("/dashboard");
    } catch {
      setError("সার্ভারে সংযোগ হচ্ছে না। পরে আবার চেষ্টা করুন।");
    }
    setBusy(false);
  }

  /* ──────── OTP verify ──────── */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.replace(/\D/g, "");
    if (code.length < 4) {
      setError("৪ সংখ্যার ভেরিফিকেশন কোড দিন।");
      return;
    }

    setError("");
    setBusy(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "ভুল কোড। সঠিক কোড দিন।");
        setBusy(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("shohoz_token", data.accessToken);
      localStorage.setItem("shohoz_user", JSON.stringify(data.user));
      document.cookie = `shohoz_token=${data.accessToken}; path=/; max-age=604800; samesite=lax`;
      router.push("/dashboard");
    } catch {
      setError("সার্ভারে সংযোগ হচ্ছে না। পরে আবার চেষ্টা করুন।");
    }
    setBusy(false);
  }

  /* ──────── Resend OTP ──────── */
  async function handleResend() {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "কোড পাঠাতে সমস্যা হয়েছে।");
      } else {
        setSuccess("নতুন কোড আপনার ইমেইলে পাঠানো হয়েছে!");
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch {
      setError("সার্ভারে সংযোগ হচ্ছে না।");
    }
    setResending(false);
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
            <p className="text-xs text-muted-foreground">আপনার ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-accent/5 p-3 text-xs text-muted-foreground space-y-1">
          <p>📧 ইমেইল পাঠানো হয়েছে: <span className="font-bold text-foreground">{maskedEmail}</span></p>
          <p>📱 মোবাইল: <span className="font-bold text-foreground">{maskedPhone}</span></p>
          <p className="text-accent font-semibold">ইমেইলের Inbox (বা Spam ফোল্ডার) চেক করুন!</p>
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
                placeholder="••••"
                type={showOtp ? "text" : "password"}
                maxLength={6}
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

          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-danger">
              <IconCircleX width={16} height={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-3 flex items-start gap-2 text-sm text-success">
              <IconCheckCircle width={16} height={16} className="mt-0.5 shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={busy}>
            {busy ? "ভেরিফাই হচ্ছে…" : "ভেরিফাই করুন ও লগইন হন"}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            কোড আসেনি?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-bold text-accent hover:underline disabled:opacity-50"
            >
              {resending ? "পাঠানো হচ্ছে…" : "আবার পাঠান"}
            </button>
          </p>

          <button
            type="button"
            onClick={() => { setStep("form"); setOtp(""); setError(""); setSuccess(""); }}
            className="mt-2 w-full text-center text-xs font-bold text-accent hover:underline"
          >
            ← তথ্য পরিবর্তন করুন
          </button>
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="পূর্ণ নাম লিখুন" className={`${inputCls} pl-11`} autoComplete="name" />
            </div>
          </label>

          {/* Mobile */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">মোবাইল নম্বর</span>
            <div className="relative">
              <IconPhone width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" className={`${inputCls} pl-11`} autoComplete="tel" />
            </div>
          </label>

          {/* Email */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">ইমেইল অ্যাড্রেস</span>
            <div className="relative">
              <IconMail width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="example@gmail.com" className={`${inputCls} pl-11`} autoComplete="email" />
            </div>
          </label>

          {/* Password */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">পাসওয়ার্ড</span>
            <div className="relative">
              <IconLock width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPwd ? "text" : "password"} placeholder="কমপক্ষে ৬ অক্ষর" className={`${inputCls} pl-11 pr-11`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                {showPwd ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="flex items-start gap-2 text-sm text-danger">
              <IconCircleX width={16} height={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy}>
            {busy ? "তৈরি হচ্ছে…" : "একাউন্ট তৈরি করুন"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            আগে থেকে একাউন্ট আছে?{" "}
            <a href="/login" className="font-bold text-accent hover:underline">লগইন করুন</a>
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
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="example@gmail.com অথবা 01XXXXXXXXX" className={`${inputCls} pl-11`} autoComplete="username" />
          </div>
        </label>

        {/* Password */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">পাসওয়ার্ড</span>
          <div className="relative">
            <IconLock width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPwd ? "text" : "password"} placeholder="আপনার পাসওয়ার্ড" className={`${inputCls} pl-11 pr-11`} autoComplete="current-password" />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
              {showPwd ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <a href="#" className="text-xs font-semibold text-accent hover:underline">পাসওয়ার্ড ভুলে গেছেন?</a>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-danger">
            <IconCircleX width={16} height={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy}>
          {busy ? "লগইন হচ্ছে…" : "লগইন করুন"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          একাউন্ট নেই?{" "}
          <a href="/register" className="font-bold text-accent hover:underline">একাউন্ট তৈরি করুন</a>
        </p>
      </form>
    </div>
  );
}