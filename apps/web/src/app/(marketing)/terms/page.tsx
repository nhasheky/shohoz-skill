import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE.name}`,
  description: "The terms that govern your use of the Shohoz Skill platform.",
};

const sections: { h: string; p: string[] }[] = [
  {
    h: "1. Your account",
    p: [
      "You must provide accurate information when creating an account. One account may be used by one primary learner.",
      "Your account may be logged in on up to " + SITE.maxDevices + " devices at a time. Logging in on a third device signs out the least-recent session.",
    ],
  },
  {
    h: "2. Content & access",
    p: [
      "Courses, exams, blogs and books are licensed, not sold. Your purchase grants you access for the duration you selected (1, 2, 3, 6 months or lifetime).",
      "Online books are watermarked with your name and order ID. You may read them but may not download, print, redistribute, or screenshot-share them.",
      "Sharing your login or downloaded copies is a violation and may result in account suspension without refund.",
    ],
  },
  {
    h: "3. Payments & refunds",
    p: [
      "All prices are in Bangladeshi Taka and include VAT. Payment is processed via bKash, Nagad or SSLCommerz.",
      "Courses & books: a full refund is available within 3 days of purchase if you have consumed less than 20% of the content. Exams and exam packages are non-refundable once started.",
      "Refunds are processed to your original payment method within 5–7 working days.",
    ],
  },
  {
    h: "4. Results & certificates",
    p: [
      "Exam results are calculated using the stated negative-marking rules at the time you submit. Our calculation is authoritative for rankings and badges.",
      "Certificates are issued automatically when your course progress reaches 100%. A certificate may be revoked if progress was achieved through automated cheating.",
    ],
  },
  {
    h: "5. Acceptable use",
    p: [
      "You agree not to: bypass the device-limit checks, scrape the platform, reverse-engineer the reader's watermarking, or attempt to access the admin panel without authorization.",
      "Bots and automated answering are not permitted in graded exams.",
    ],
  },
  {
    h: "6. Liability",
    p: [
      "We work hard to keep the platform online and correct, but the service is provided as-is. To the maximum extent permitted by law, our total liability is limited to the amount you paid us in the previous 12 months.",
    ],
  },
  {
    h: "7. Changes",
    p: [
      "We may update these terms from time to time. Material changes will be emailed to you at least 14 days before they take effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="navy" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Legal" title="Terms of Service" description={`Last updated: ${new Date().toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}`} center />
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