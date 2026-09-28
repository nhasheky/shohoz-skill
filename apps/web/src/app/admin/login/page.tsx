"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminSession } from "@/lib/admin-api";
import { useAdminTitle } from "@/lib/use-admin-title";
import { LogoMark } from "@/components/brand/logo-mark";
import { IconKey, IconShieldCheck } from "@/components/ui/icons";

export default function AdminLoginPage() {
  useAdminTitle("Admin Login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://shohoz-api.onrender.com";
      const res = await fetch(`${apiUrl}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSession(data.accessToken, data.user?.role ?? "SUPER_ADMIN", data.user?.name ?? "Admin");
        router.push("/admin");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Invalid email or password.");
        setBusy(false);
      }
    } catch {
      setError("Cannot connect to server. Try again later.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <LogoMark markOnly className="[&_svg]:h-12 [&_svg]:w-12" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage the platform</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shohozskill.com"
              autoComplete="username"
              autoFocus
              className={inputCls}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`${inputCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <IconKey width={13} height={13} /> Session is stored in your browser (localStorage).
          </p>
        </form>
      </div>
    </div>
  );
}
