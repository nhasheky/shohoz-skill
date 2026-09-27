import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { AuthForm } from "@/components/auth/auth-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Register — ${SITE.name}`,
  description: `Create your ${SITE.name} account in under a minute.`,
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-16">
      <BackgroundOrbs variant="accent" />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark markOnly className="[&_svg]:h-9 [&_svg]:w-9" />
          <div>
            <p className="font-display text-xl font-extrabold text-foreground">{SITE.name}</p>
            <p className="text-xs text-muted-foreground">{SITE.tagline}</p>
          </div>
        </div>
        <AuthForm mode="register" />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <a href="/terms" className="text-accent hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}