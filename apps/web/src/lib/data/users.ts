import type { AppUser, Order } from "@/lib/types";

export const demoUser: AppUser = {
  id: "usr-demo",
  name: "Rahim Uddin",
  nameBn: "রহিম উদ্দিন",
  email: "rahim@example.com",
  phone: "+8801712-345678",
  role: "STUDENT",
  status: "ACTIVE",
  joinedAt: "2025-03-12",
  verified: true,
  devices: [
    { id: "dev-1", deviceName: "Pixel 8 · Chrome", browser: "Chrome 126", os: "Android 14", ip: "103.67.156.21", lastActive: new Date(Date.now() - 1000 * 60 * 4).toISOString(), current: true },
    { id: "dev-2", deviceName: "Dell Inspiron · Edge", browser: "Edge 125", os: "Windows 11", ip: "103.67.156.21", lastActive: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), current: false },
  ],
};

export const demoOrders: Order[] = [
  { id: "ORD-88421", userId: "usr-demo", productType: "course", productId: "crs-bcs-prelim", productTitle: "BCS Preliminary Complete Course", amount: 4990, method: "BKASH", status: "PAID", createdAt: "2026-01-05", txId: "BKAH-991X" },
  { id: "ORD-88210", userId: "usr-demo", productType: "exam", productId: "exam-pkg-ntrca", productTitle: "NTRCA Exam Package", amount: 1499, method: "NAGAD", status: "PAID", createdAt: "2025-12-18", txId: "NGD-33T" },
  { id: "ORD-87892", userId: "usr-demo", productType: "book", productId: "bk-bcs-bangla", productTitle: "BCS Preliminary Bangla Guide (Hardcopy)", amount: 550, method: "SSC", status: "PAID", createdAt: "2025-11-02", txId: "SSC-1282" },
  { id: "ORD-87710", userId: "usr-demo", productType: "book", productId: "bk-english-grammar", productTitle: "English Grammar for BCS & Bank (PDF)", amount: 349, method: "BKASH", status: "REFUNDED", createdAt: "2025-10-21", txId: "BKAH-884Q" },
];

export type DemoEnrollment = {
  id: string;
  productId: string;
  slug: string;
  type: "course" | "book" | "exam";
  title: string;
  progress: number;
  accessFrom: string;
  accessExpires?: string;
  downloadPdf?: boolean;
  viaAdmin?: boolean;
};

export const demoEnrollments: DemoEnrollment[] = [
  { id: "enr-1", productId: "crs-bcs-prelim", slug: "bcs-preliminary-complete-course", type: "course", title: "BCS Preliminary Complete Course", progress: 62, accessFrom: "2026-01-05" },
  { id: "enr-2", productId: "exam-pkg-ntrca", slug: "ntrca-exam-package", type: "exam", title: "NTRCA Exam Package", progress: 34, accessFrom: "2025-12-18" },
  { id: "enr-3", productId: "bk-bcs-bangla", slug: "bcs-preliminary-bangla-guide", type: "book", title: "BCS Preliminary Bangla Guide", progress: 100, accessFrom: "2025-11-02", downloadPdf: true },
  { id: "enr-4", productId: "crs-gk-current", slug: "gk-current-affairs-crash", type: "course", title: "GK & Current Affairs Crash", progress: 12, accessFrom: "2025-12-01", viaAdmin: true },
  { id: "enr-5", productId: "exam-english-free", slug: "english-free", type: "exam", title: "English Grammar Free Test", progress: 100, accessFrom: "2026-01-10" },
];

export const demoResults = [
  { id: "res-1", examTitle: "NTRCA Math — সহজ গণিত", score: 13, total: 15, negative: 0.25, date: "2026-01-08", durationUsed: 12 },
  { id: "res-2", examTitle: "Bangla ব্যাকরণ Topic Test", score: 12, total: 15, negative: 0.25, date: "2026-01-06", durationUsed: 13 },
  { id: "res-3", examTitle: "English Free Test", score: 7, total: 10, negative: 0.25, date: "2026-01-10", durationUsed: 6 },
  { id: "res-4", examTitle: "GK Bangladesh Affairs", score: 9, total: 15, negative: 0.25, date: "2025-12-30", durationUsed: 14 },
];