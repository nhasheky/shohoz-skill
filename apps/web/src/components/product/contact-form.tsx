"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconSend } from "@/components/ui/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://shohoz-api.onrender.com";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim() || undefined,
      subject: String(data.get("topic") ?? "").trim() || undefined,
      message: String(data.get("message") ?? "").trim(),
    };

    setState("sending");
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setState("sent");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

  if (state === "sent") {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-12 text-center shadow-card">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <IconCheckCircle width={30} height={30} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-foreground">Message received!</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We&rsquo;ll get back to you at the email you provided — usually within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-display text-2xl font-extrabold text-foreground">Send us a message</h2>
      <p className="mt-1 text-sm text-muted-foreground">Fields marked * are required.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your name *</span>
          <input required name="name" className={inputCls} placeholder="e.g. Rahim Uddin" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email *</span>
          <input required type="email" name="email" className={inputCls} placeholder="you@example.com" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</span>
          <input name="phone" inputMode="tel" className={inputCls} placeholder="01XXXXXXXXX" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topic</span>
          <select name="topic" className={inputCls} defaultValue="support">
            <option value="support">Support / help</option>
            <option value="refund">Refund request</option>
            <option value="bulk">Bulk order (school / coaching)</option>
            <option value="partnership">Partnership</option>
            <option value="other">Something else</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message *</span>
        <textarea required name="message" rows={5} className={inputCls} placeholder="How can we help?" />
      </label>

      {state === "error" && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <Button type="submit" variant="accent" size="lg" className="mt-6 w-full" disabled={state === "sending"}>
        <IconSend width={16} height={16} className="mr-2" />
        {state === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
