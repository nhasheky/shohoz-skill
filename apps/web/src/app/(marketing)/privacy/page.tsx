import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE.name}`,
  description: "How Shohoz Skill collects, uses and protects your personal data.",
};

const sections: { h: string; p: string[] }[] = [
  {
    h: "1. What we collect",
    p: [
      "Account data: name, email or mobile number, and (optionally) a profile photo you choose to upload.",
      "Learning data: courses you enroll in, lessons you watch, exam attempts and results, books you open, and your reading progress.",
      "Device data: when you log in on a new device we store a device name and a signed session so we can enforce our two-device login policy.",
      "Payment data: payment is processed by our licensed gateways (bKash, Nagad, SSLCommerz). We only store the order reference and a masked method — never your card or wallet PIN.",
    ],
  },
  {
    h: "2. How we use it",
    p: [
      "To deliver the service: show your courses, resume progress, sync your reading position, and give you results and certificates.",
      "To improve the product: aggregate analytics on which lessons are hardest or most skipped (never tied to your identity).",
      "To talk to you: order receipts, expiry reminders, and service messages. Marketing emails are opt-in only.",
    ],
  },
  {
    h: "3. What we never do",
    p: [
      "We never sell your personal data.",
      "We never show your real name publicly unless you ask (reviews are display-name only).",
      "We never scan your device content beyond what the two-device session check requires.",
    ],
  },
  {
    h: "4. Cookies & local storage",
    p: [
      "We use a single first-party localStorage key (shohoz-theme) for your theme choice, plus the platform's own storage for your session and reading state.",
      "No cross-site tracking cookies are used on this preview build.",
    ],
  },
  {
    h: "5. Your rights",
    p: [
      "You may request a copy or deletion of your account data at any time by writing to " + SITE.supportEmail + ".",
      "Deleting your account revokes all device sessions immediately and anonymises your exam results.",
    ],
  },
  {
    h: "6. Contact",
    p: [
      "Questions about this policy? Write to " + SITE.supportEmail + " or visit our office at " + SITE.address + ".",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Legal" title="Privacy Policy" description={`Last updated: ${new Date().toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}`} center />
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-xl font-extrabold text-foreground">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">{para}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}