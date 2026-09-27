import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/lib/site";
import { LogoMark } from "@/components/brand/logo-mark";
import { IconFacebook, IconInstagram, IconMail, IconMapPin, IconPhone, IconTelegram, IconYoutube } from "@/components/ui/icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <LogoMark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.name} helps Bangladeshi job-seekers prepare for government jobs through{" "}
              <span className="font-semibold text-foreground">courses, MCQ exams, and books</span> — fast, focused, and affordable.
              <span className="text-accent"> Learn to Earn.</span>
            </p>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2 hover:text-foreground">
                <IconMail width={16} height={16} className="text-sky-deep" /> {SITE.supportEmail}
              </a>
              <span className="flex items-center gap-2">
                <IconPhone width={16} height={16} className="text-sky-deep" /> {SITE.phone}
              </span>
              <span className="flex items-center gap-2">
                <IconMapPin width={16} height={16} className="text-sky-deep" /> {SITE.address}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {[
                { href: SITE.socials.facebook, icon: <IconFacebook width={18} height={18} />, label: "Facebook" },
                { href: SITE.socials.youtube, icon: <IconYoutube width={18} height={18} />, label: "YouTube" },
                { href: SITE.socials.instagram, icon: <IconInstagram width={18} height={18} />, label: "Instagram" },
                { href: SITE.socials.telegram, icon: <IconTelegram width={18} height={18} />, label: "Telegram" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Products</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.products.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-muted-foreground transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.company.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-muted-foreground transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Support</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.support.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-muted-foreground transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">বাংলায় ভর্তি পরামর্শ</p>
              <p className="mt-1 text-xs text-muted-foreground">প্রতিদিন সকাল ৯টা – রাত ১১টা</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["bkash", "nagad", "sslcommerz"].map((p) => (
              <span key={p} className="capitalize text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}