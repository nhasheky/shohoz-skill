import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { AuthForm } from "@/components/auth/auth-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Login — ${SITE.name}`,
  description: `Log in to ${SITE.name} with your email or mobile number.`,
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-16">
      <BackgroundOrbs variant="navy" />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark markOnly className="[&_svg]:h-9 [&_svg]:w-9" />
          <div>
            <p className="font-display text-xl font-extrabold text-foreground">{SITE.name}</p>
            <p className="text-xs text-muted-foreground">{SITE.tagline}</p>
          </div>
        </div>
        <AuthForm mode="login" />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <a href="/terms" className="text-accent hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}