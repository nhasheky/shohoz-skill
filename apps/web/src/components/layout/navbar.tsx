"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { IconMenu, IconX } from "@/components/ui/icons";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 glass">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Shohoz Skill home" className="shrink-0" onClick={() => setOpen(false)}>
          <LogoMark />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <ButtonLink href="/login" variant="ghost" size="sm" className="hidden md:inline-flex">
            Login
          </ButtonLink>
          <ButtonLink href="/register" variant="accent" size="sm" className="hidden md:inline-flex">
            Get Started
          </ButtonLink>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden cursor-pointer"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX width={20} height={20} /> : <IconMenu width={20} height={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-muted-foreground">Menu</span>
              <ThemeToggle />
            </div>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-[15px] font-medium",
                    active ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
              <ButtonLink href="/login" variant="outline" fullWidth>
                Login
              </ButtonLink>
              <ButtonLink href="/register" variant="accent" fullWidth>
                Get Started — {SITE.tagline}
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}