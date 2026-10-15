"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconSend } from "@/components/ui/icons";
import { trackEvent } from "@/lib/track";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd")
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setState("sending");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: value, source: "footer" }),
      });
      if (!res.ok) {
        throw new Error(res.status === 400 ? "সঠিক ইমেইল অ্যাড্রেস দিন।" : `Request failed (${res.status})`);
      }
      trackEvent("Lead", { content_name: "newsletter", source: "footer", value: 1, currency: "BDT" });
      setEmail("");
      setState("done");
      setMessage("ধন্যবাদ! আপনার ইমেইল সেভ হয়েছে — নতুন কোর্স, ফ্রি ক্লাস আর অফার প্রথমে আপনিই পাবেন।");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error && err.message ? err.message : "কিছু একটা ভুল হয়েছে, আবার চেষ্টা করুন।");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-8">
        <div>
          <h3 className="font-display text-base font-extrabold text-foreground">নিউজলেটার সাবস্ক্রাইব করুন</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            নতুন কোর্স, ফ্রি মডেল টেস্ট আর ডিসকাউন্ট অফার সবার আগে আপনার ইমেইলে পেতে ইমেইল দিন।
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent sm:max-w-xs"
          />
          <Button type="submit" variant="accent" size="lg" disabled={state === "sending"} className="shrink-0">
            {state === "done" ? (
              <>
                <IconCheckCircle width={16} height={16} className="mr-2" />
                সাবস্ক্রাইব হয়েছে
              </>
            ) : (
              <>
                <IconSend width={16} height={16} className="mr-2" />
                {state === "sending" ? "সেভ হচ্ছে…" : "সাবস্ক্রাইব"}
              </>
            )}
          </Button>
        </div>
      </div>

      {message && (
        <p className={cn("mt-3 text-xs font-semibold", state === "error" ? "text-danger" : "text-success")} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
