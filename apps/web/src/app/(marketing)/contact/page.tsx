import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { SITE } from "@/lib/site";
import { getPageContent, getSiteSettings, type ContactPageData } from "@/lib/api";
import { ContactForm } from "@/components/product/contact-form";
import { IconMail, IconMapPin, IconPhone, IconClock } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: `Contact Us — ${SITE.name}`,
  description: "Talk to the Shohoz Skill team — support, refunds, bulk orders for schools and coaching centres, or partnership ideas.",
};

export default async function ContactPage() {
  const contact = await getPageContent<ContactPageData>("contact");
  const settings = await getSiteSettings().catch(() => null);
  
  const email = contact.email || settings?.supportEmail || SITE.supportEmail;
  const phone = contact.phone || settings?.supportPhone || SITE.phone;
  const address = contact.address || settings?.address || SITE.address;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Contact"
            title={contact.title || "We answer fast — usually within a day"}
            description={contact.description || "Support, refunds, bulk school orders, or just a question about a course. Pick whatever is easiest for you."}
            center
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <ContactForm />

          <div className="space-y-4">
            {[
              { icon: IconPhone, t: "Call / WhatsApp", lines: [`${phone}`, "10 AM – 10 PM, Sat–Thu"] },
              { icon: IconMail, t: "Email", lines: [`${email}`, "We reply within 24 hours"] },
              { icon: IconMapPin, t: "Office", lines: [`${address}`] },
              { icon: IconClock, t: "Support hours", lines: [contact.supportHours || "Saturday – Thursday", "10:00 AM – 10:00 PM (BST)"] },
            ].map((c) => (
              <div key={c.t} className="flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <c.icon width={20} height={20} />
                </span>
                <div>
                  <p className="font-display text-sm font-extrabold text-foreground">{c.t}</p>
                  {c.lines.map((l, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}