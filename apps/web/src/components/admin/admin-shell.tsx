"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { clearAdminSession, getAdminSession } from "@/lib/admin-api";
import { ToastProvider } from "./admin-toast";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  IconBookOpen,
  IconChart,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDashboard,
  IconGlobe,
  IconHome,
  IconLayers,
  IconLock,
  IconLogout,
  IconMail,
  IconMenu,
  IconMessageCircle,
  IconSettings,
  IconSparkles,
  IconTarget,
  IconUsers,
  IconWallet,
  IconX,
} from "@/components/ui/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: IconDashboard, exact: true },
  { href: "/admin/categories", label: "Categories", icon: IconLayers },
  { href: "/admin/courses", label: "Courses", icon: IconLayers },
  { href: "/admin/books", label: "Books", icon: IconBookOpen },
  { href: "/admin/exams", label: "Exams", icon: IconTarget },
  { href: "/admin/blogs", label: "Blog Posts", icon: IconChart },
  { href: "/admin/users", label: "Users", icon: IconUsers },
  { href: "/admin/orders", label: "Orders", icon: IconWallet },
  { href: "/admin/incomplete", label: "Incomplete Orders", icon: IconClock },
  { href: "/admin/blocked", label: "Blocked Customers", icon: IconLock },
  { href: "/admin/coupons", label: "Coupons", icon: IconSparkles },
  { href: "/admin/reviews", label: "Reviews", icon: IconMessageCircle },
  { href: "/admin/messages", label: "Contact Messages", icon: IconMail },
  { href: "/admin/pages", label: "Pages", icon: IconGlobe },
  { href: "/admin/settings", label: "Site Settings", icon: IconSettings },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}>
        <LogoMark markOnly className="[&_svg]:h-9 [&_svg]:w-9 shrink-0" />
        {!collapsed && (
          <div className="leading-none">
            <p className="font-display text-sm font-extrabold tracking-tight text-white">Shohoz Skill</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                collapsed && "justify-center px-0",
                active ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon width={17} height={17} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href="/"
          title="Back to site"
          className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white", collapsed && "justify-center px-0")}
        >
          <IconGlobe width={17} height={17} className="shrink-0" />
          {!collapsed && "Back to site"}
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(() => getAdminSession());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const name = typeof window !== "undefined" ? (localStorage.getItem("shohoz_name") ?? "") : "";

  const isAdmin = Boolean(session && ["ADMIN", "SUPER_ADMIN"].includes(session.role));
  const isLoginRoute = pathname === "/admin/login";

  // Route guards: unauthorized → /admin/login, already-authenticated on login → /admin.
  useEffect(() => {
    if (!isAdmin && !isLoginRoute) router.replace("/admin/login");
    if (isAdmin && isLoginRoute) router.replace("/admin");
  }, [isAdmin, isLoginRoute, router]);

  // No/invalid session: show the login page standalone (outside the shell).
  if (!isAdmin) {
    if (isLoginRoute) return <ToastProvider>{children}</ToastProvider>;
    return <GateLoading />;
  }

  // Valid session but visiting the login page → redirecting to /admin.
  if (isLoginRoute) return <GateLoading />;

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-surface dark:bg-background">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col bg-[#0b1826] transition-[width] duration-200 lg:flex",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <SidebarContent collapsed={collapsed} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[120] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 bg-[#0b1826] shadow-pop">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <IconX width={18} height={18} />
              </button>
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground lg:hidden"
                  aria-label="Open menu"
                >
                  <IconMenu width={18} height={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsed((v) => !v)}
                  className="hidden rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground lg:block"
                  aria-label="Toggle sidebar"
                >
                  {collapsed ? <IconChevronRight width={18} height={18} /> : <IconChevronLeft width={18} height={18} />}
                </button>
                <span className="text-sm font-bold text-muted-foreground lg:hidden">Admin</span>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/" className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground sm:flex">
                  <IconHome width={14} height={14} /> View site
                </Link>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-extrabold text-primary dark:bg-surface">
                    {(name || session?.role || "A").charAt(0).toUpperCase()}
                  </span>
                  <div className="hidden leading-none sm:block">
                    <p className="text-sm font-bold text-foreground">{name || "Admin"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-accent">{session?.role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAdminSession();
                    setSession(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-danger hover:text-danger"
                >
                  <IconLogout width={14} height={14} /> <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

function GateLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
    </div>
  );
}
