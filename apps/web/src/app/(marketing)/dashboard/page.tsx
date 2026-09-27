import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getMe, getMyEnrollments, getMyOrders, getMyAttempts } from "@/lib/api";
import { BackgroundOrbs } from "@/components/layout/background";

export const metadata: Metadata = {
  title: "Dashboard — Shohoz Skill",
  description: "Your courses, books, exams, orders and devices.",
  robots: { index: false },
};

export const revalidate = 60;

export default async function DashboardPage() {
  // Falls back to demo data when the API is unreachable or the user is not authenticated.
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
      </div>
    </main>
  );
}