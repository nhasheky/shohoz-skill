"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatBdt, formatDate, timeAgo } from "@/lib/format";
import { ProductCover } from "@/components/ui/product-cover";
import type { AppUser, DeviceSession, Order } from "@/lib/types";
import type { DemoEnrollment } from "@/lib/data/users";
import { Button } from "@/components/ui/button";
import {
  IconBookOpen,
  IconDashboard,
  IconDevice,
  IconKey,
  IconLayers,
  IconLock,
  IconLogout,
  IconSettings,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";

type Tab = "overview" | "courses" | "books" | "exams" | "orders" | "devices" | "settings";

const TABS: { id: Tab; label: string; icon: (p: { width?: number; height?: number; className?: string }) => ReactNode }[] = [
  { id: "overview", label: "Overview", icon: IconDashboard },
  { id: "courses", label: "My Courses", icon: IconLayers },
  { id: "books", label: "My Books", icon: IconBookOpen },
  { id: "exams", label: "My Exams", icon: IconTarget },
  { id: "orders", label: "Orders", icon: IconWallet },
  { id: "devices", label: "Devices", icon: IconDevice },
  { id: "settings", label: "Settings", icon: IconSettings },
];

export function DashboardShell({
  user,
  enrollments,
  orders,
  results,
}: {
  user: AppUser;
  enrollments: DemoEnrollment[];
  orders: Order[];
  results: { id: string; examTitle: string; score: number; total: number; negative: number; date: string; durationUsed: number }[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [devices, setDevices] = useState<DeviceSession[]>(user.devices);
  const [revoked, setRevoked] = useState<string[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

  async function cancelOrder(id: string) {
    if (typeof window !== "undefined" && !window.confirm("আপনি এই অর্ডারটি বাতিল করতে চান?")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("shohoz_token") : null;
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/cancel`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string })?.message || "বাতিল করা যায়নি।");
      router.refresh();
    } catch (e) {
      if (typeof window !== "undefined") window.alert(e instanceof Error ? e.message : "বাতিল করা যায়নি।");
    }
  }

  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  async function savePin() {
    if (pin.trim().length < 4) {
      window.alert("পাসওয়ার্ড / PIN অন্তত ৪ অক্ষরের হতে হবে।");
      return;
    }
    if (pin !== pin2) {
      window.alert("দুইবার একই পাসওয়ার্ড লিখুন।");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("shohoz_token") : null;
    setSavingPin(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ password: pin }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string })?.message || "সেভ হয়নি।");
      window.alert("পাসওয়ার্ড সেভ হয়েছে ✅");
      setPin("");
      setPin2("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "সেভ হয়নি।");
    } finally {
      setSavingPin(false);
    }
  }

  const courses = enrollments.filter((e) => e.type === "course");
  const books = enrollments.filter((e) => e.type === "book");
  const exams = enrollments.filter((e) => e.type === "exam");

  const avgPct = useMemo(() => {
    if (!results.length) return 0;
    return Math.round((results.reduce((n, r) => n + r.score / r.total, 0) / results.length) * 100);
  }, [results]);

  function logoutDevice(id: string) {
    setDevices((d) => d.filter((x) => x.id !== id));
    setRevoked((r) => [...r, id]);
  }

  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("shohoz_token");
    localStorage.removeItem("shohoz_user");
    document.cookie = "shohoz_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  }

  const deviceText = `${devices.length} / ${2} active`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky font-display text-2xl font-extrabold text-white dark:from-primary dark:to-sky-deep">
            {user.name.charAt(0)}
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {user.name}
              {user.nameBn && <span className="text-muted-foreground"> · {user.nameBn}</span>}
            </h1>
            <p className="text-sm text-muted-foreground">
              Member since {formatDate(user.joinedAt)} · <span className="text-success">Verified</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <IconDevice width={14} height={14} className="text-accent" /> {deviceText} devices
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <IconLogout width={15} height={15} className="mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-8 flex gap-1.5 overflow-x-auto border-b border-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-bold transition-colors",
              tab === t.id ? "border-b-2 border-accent bg-accent/5 text-accent" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon width={15} height={15} />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatTile label="Enrolled items" value={enrollments.length} sub="across all types" />
                <StatTile label="Avg. exam score" value={`${avgPct}%`} sub={`${results.length} attempts`} />
                <StatTile label="Orders" value={orders.filter((o) => o.status === "PAID").length} sub="paid" />
                <StatTile label="Devices" value={deviceText} sub="max 2" />
              </div>

              {/* Continue learning */}
              <section>
                <h2 className="font-display text-lg font-extrabold text-foreground">Continue learning</h2>
                <div className="mt-4 space-y-3">
                  {courses.filter((c) => c.progress < 100).slice(0, 3).map((c) => (
                    <ContinueCard key={c.id} item={c} />
                  ))}
                </div>
              </section>

              {/* Recent results */}
              <section>
                <h2 className="font-display text-lg font-extrabold text-foreground">Recent exam results</h2>
                <div className="mt-4 space-y-2">
                  {results.slice(0, 4).map((r) => {
                    const pct = Math.round((r.score / r.total) * 100);
                    return (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-card">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{r.examTitle}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(r.date)} · {r.durationUsed} min used</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", pct >= 60 ? "bg-success/10 text-success" : pct >= 40 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger")}>
                            {pct}%
                          </span>
                          <span className="font-mono text-sm font-bold text-foreground">{r.score}/{r.total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              {/* Profile */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-display text-sm font-extrabold text-foreground">Profile</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <Row k="Name" v={`${user.name} ${user.nameBn ?? ""}`} />
                  <Row k="Email" v={user.email} />
                  <Row k="Phone" v={user.phone} />
                  <Row k="Joined" v={formatDate(user.joinedAt)} />
                </dl>
              </div>
              {/* Device summary */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold text-foreground">Active devices</h3>
                  <button type="button" onClick={() => setTab("devices")} className="text-xs font-bold text-accent hover:underline">
                    Manage
                  </button>
                </div>
                <ul className="mt-4 space-y-3">
                  {devices.slice(0, 3).map((d) => (
                    <li key={d.id} className="flex items-center gap-3 text-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <IconDevice width={16} height={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {d.deviceName}
                          {d.current && <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">This device</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{d.os} · last active {timeAgo(d.lastActive)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}

        {tab === "courses" && <ItemGrid title="My Courses" items={courses} empty="You haven't enrolled in any course yet." accent="Enroll in a course" href="/courses" />}
        {tab === "books" && <ItemGrid title="My Books" items={books} empty="No books yet." accent="Browse books" href="/books" />}
        {tab === "exams" && <ItemGrid title="My Exams" items={exams} empty="No exams attempted yet." accent="Try a free exam" href="/exams?type=free" />}

        {tab === "orders" && (
          <section>
            <h2 className="font-display text-lg font-extrabold text-foreground">Order history</h2>
            <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-bold">Order</th>
                      <th className="px-5 py-3 font-bold">Item</th>
                      <th className="px-5 py-3 font-bold">Method</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold">Delivery</th>
                      <th className="px-5 py-3 text-right font-bold">Total</th>
                      <th className="px-5 py-3 font-bold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-bold text-foreground">#{o.orderNumber ?? o.id.slice(-6)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                        </td>
                        <td className="max-w-[24ch] truncate px-5 py-3 text-muted-foreground">{o.productTitle}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{o.method}</td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-bold",
                              o.status === "PAID" ? "bg-success/10 text-success" : o.status === "REFUNDED" ? "bg-warning/10 text-warning" : o.status === "CANCELLED" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-muted-foreground">{o.isPhysical ? formatBdt(o.deliveryCharge ?? 0) : "—"}</td>
                        <td className="px-5 py-3 text-right font-bold text-foreground">{formatBdt(o.total ?? o.amount)}</td>
                        <td className="px-5 py-3 text-right">
                          {o.status === "PENDING" ? (
                            <button type="button" onClick={() => cancelOrder(o.id)} className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10">
                              Cancel
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === "devices" && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold text-foreground">Devices & sessions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can be logged in on up to <span className="font-bold text-foreground">2 devices</span> at once. {devices.length} currently active.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {devices.map((d) => (
                <div key={d.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <IconDevice width={20} height={20} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {d.deviceName}
                          {d.current && <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">Current</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{d.browser} · {d.os}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={d.current} onClick={() => logoutDevice(d.id)}>
                      {d.current ? <IconLock width={13} height={13} /> : "Revoke"}
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>IP: <span className="font-mono">{d.ip}</span></span>
                    <span>Active: {timeAgo(d.lastActive)}</span>
                  </div>
                </div>
              ))}
              {revoked.length > 0 && (
                <div className="rounded-3xl border border-dashed border-border p-5">
                  <p className="text-sm font-bold text-muted-foreground">Revoked this session</p>
                  <p className="mt-1 text-xs text-muted-foreground">You revoked {revoked.length} device{revoked.length > 1 ? "s" : ""}. In production this instantly invalidates the session token.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "settings" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
                <IconKey width={18} height={18} className="text-accent" /> Change password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">We use OTP login, but you can still set a PIN for quick access.</p>
              <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); void savePin(); }}>
                <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="New PIN / password (4+ characters)" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-accent" />
                <input type="password" value={pin2} onChange={(e) => setPin2(e.target.value)} placeholder="Confirm PIN / password" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-accent" />
                <Button type="submit" variant="accent" disabled={savingPin}>{savingPin ? "Saving…" : "Save PIN"}</Button>
              </form>
            </div>
            <div className="rounded-3xl border border-danger/30 bg-danger/5 p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
                <IconUsers width={18} height={18} className="text-danger" /> Danger zone
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Delete your account and all associated data. This also revokes every device session and anonymises exam results.</p>
              <Button variant="outline" className="mt-4 border-danger/40 text-danger hover:bg-danger/10">Delete account</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <p className="font-display text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-semibold text-foreground">{v}</dd>
    </div>
  );
}

function ContinueCard({ item }: { item: DemoEnrollment }) {
  const href = item.type === "course" ? `/course/${item.slug}/learn` : item.type === "book" ? `/book/${item.slug}/read?mode=full` : `/exam/${item.slug}/take`;
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-colors hover:border-accent/50">
      <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl sm:block">
        <ProductCover title={item.title} category={item.type} kind={item.type} compact />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground group-hover:text-accent">{item.title}</p>
        <p className="text-xs text-muted-foreground">Enrolled {formatDate(item.accessFrom)}</p>
        {item.giftFrom && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
            🎁 Gift — “{item.giftFrom}” কোর্সের জন্য
          </span>
        )}
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${item.progress}%` }} />
          </div>
          <span className="text-xs font-bold text-foreground">{item.progress}%</span>
        </div>
      </div>
    </Link>
  );
}

function ItemGrid({ title, items, empty, accent, href }: { title: string; items: DemoEnrollment[]; empty: string; accent: string; href: string }) {
  return (
    <section>
      <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{empty}</p>
          <ButtonLinkHref href={href} variant="accent">{accent}</ButtonLinkHref>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <ContinueCard key={c.id} item={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function ButtonLinkHref({ href, variant, children }: { href: string; variant: "accent"; children: ReactNode }) {
  void variant;
  return (
    <a href={href} className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover">
      {children}
    </a>
  );
}