import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MyReviewsPanel } from "@/components/dashboard/my-reviews-panel";
import { getMe, getMyEnrollments, getMyOrders, getMyAttempts, hasSession } from "@/lib/api";
import { BackgroundOrbs } from "@/components/layout/background";

export const metadata: Metadata = {
  title: "Dashboard — Shohoz Skill",
  description: "Your courses, books, exams, orders and devices.",
  robots: { index: false },
};

export const revalidate = 60;

export default async function DashboardPage() {
  // Digital content is gated: no authenticated session → sign in first.
  if (!(await hasSession())) redirect("/login");

  const [user, enrollments, orders, results] = await Promise.all([
    getMe(),
    getMyEnrollments(),
    getMyOrders(),
    getMyAttempts(),
  ]);

  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
        <BackgroundOrbs variant="navy" className="opacity-60" />
      </div>
      <div className="relative">
        <DashboardShell user={user} enrollments={enrollments} orders={orders} results={results} />
        <MyReviewsPanel />
      </div>
    </main>
  );
}