import type { AppUser, Order } from "@/lib/types";

export const adminStats = {
  totalUsers: 62418,
  newUsers30d: 2910,
  activeSubscriptions: 15420,
  totalRevenueBdt: 8424000,
  revenue30d: 1184000,
  avgConversion: 3.4,
  pendingReviews: 7,
  pendingOrders: 14,
  refunds30d: 86,
};

export const revenueSeries = [
  { label: "Jan", revenue: 620, exams: 210, courses: 340, books: 70 },
  { label: "Feb", revenue: 700, exams: 240, courses: 380, books: 80 },
  { label: "Mar", revenue: 640, exams: 220, courses: 350, books: 70 },
  { label: "Apr", revenue: 810, exams: 280, courses: 440, books: 90 },
  { label: "May", revenue: 760, exams: 260, courses: 410, books: 90 },
  { label: "Jun", revenue: 940, exams: 320, courses: 510, books: 110 },
  { label: "Jul", revenue: 1020, exams: 360, courses: 540, books: 120 },
  { label: "Aug", revenue: 1100, exams: 380, courses: 600, books: 120 },
  { label: "Sep", revenue: 1170, exams: 410, courses: 630, books: 130 },
  { label: "Oct", revenue: 1240, exams: 440, courses: 670, books: 130 },
  { label: "Nov", revenue: 1260, exams: 450, courses: 680, books: 130 },
  { label: "Dec", revenue: 1184, exams: 420, courses: 640, books: 124 },
];

export const adminUsers: AppUser[] = [
  { id: "u1", name: "Mahmudul Hasan", nameBn: "মাহমুদুল হাসান", email: "mahmud@shohozskill.com", phone: "+8801711000001", role: "TEACHER", status: "ACTIVE", joinedAt: "2020-04-02", verified: true, devices: [{ id: "d1", deviceName: "MacBook Pro · Chrome", browser: "Chrome 126", os: "macOS 15", ip: "103.67.1.1", lastActive: "2026-01-29", current: true }] },
  { id: "u2", name: "Shirin Akter", nameBn: "শিরিন আক্তার", email: "shirin@shohozskill.com", phone: "+8801711000002", role: "TEACHER", status: "ACTIVE", joinedAt: "2021-06-14", verified: true, devices: [{ id: "d2", deviceName: "Pixel 8 · Chrome", browser: "Chrome 126", os: "Android 14", ip: "103.67.1.2", lastActive: "2026-01-30", current: true }] },
  { id: "u3", name: "Rahim Uddin", nameBn: "রহিম উদ্দিন", email: "rahim@example.com", phone: "+8801712345678", role: "STUDENT", status: "ACTIVE", joinedAt: "2025-03-12", verified: true, devices: [
    { id: "d3", deviceName: "Pixel 8 · Chrome", browser: "Chrome 126", os: "Android 14", ip: "103.67.156.21", lastActive: "2026-01-31", current: true },
    { id: "d4", deviceName: "Dell Inspiron · Edge", browser: "Edge 125", os: "Windows 11", ip: "103.67.156.21", lastActive: "2026-01-30", current: false },
  ] },
  { id: "u4", name: "Karim Sheikh", nameBn: "করিম শেখ", email: "karim@example.com", phone: "+8801712345670", role: "STUDENT", status: "SUSPENDED", joinedAt: "2025-08-01", verified: false, devices: [] },
  { id: "u5", name: "Nadia Islam", nameBn: "নাদিয়া ইসলাম", email: "nadia@example.com", phone: "+8801712345671", role: "STUDENT", status: "ACTIVE", joinedAt: "2025-06-20", verified: true, devices: [{ id: "d5", deviceName: "iPhone 15 · Safari", browser: "Safari 17", os: "iOS 18", ip: "103.67.156.33", lastActive: "2026-01-31", current: true }] },
  { id: "u6", name: "Tanvir Ahmed", nameBn: "তানভীর আহমেদ", email: "tanvir@shohozskill.com", phone: "+8801711000006", role: "ADMIN", status: "ACTIVE", joinedAt: "2020-11-05", verified: true, devices: [] },
];

export const adminOrders: Order[] = [
  { id: "ORD-88421", userId: "u3", productType: "course", productId: "crs-bcs-prelim", productTitle: "BCS Preliminary Complete Course", amount: 4990, method: "BKASH", status: "PAID", createdAt: "2026-01-28", txId: "BKAH-991X" },
  { id: "ORD-88420", userId: "u5", productType: "exam", productId: "exam-pkg-ntrca", productTitle: "NTRCA Exam Package", amount: 1499, method: "NAGAD", status: "PAID", createdAt: "2026-01-28", txId: "NGD-552A" },
  { id: "ORD-88419", userId: "u7", productType: "book", productId: "bk-bcs-bangla", productTitle: "BCS Preliminary Bangla Guide (PDF)", amount: 399, method: "BKASH", status: "PENDING", createdAt: "2026-01-27", txId: "BKAH-112B" },
  { id: "ORD-88418", userId: "u8", productType: "course", productId: "crs-viva-interview", productTitle: "Govt Job Viva & Interview Course", amount: 2490, method: "SSC", status: "PAID", createdAt: "2026-01-27", txId: "SSC-8891" },
  { id: "ORD-88417", userId: "u9", productType: "exam", productId: "exam-pkg-bcs", productTitle: "BCS Preliminary Exam Package", amount: 2499, method: "NAGAD", status: "FAILED", createdAt: "2026-01-26", txId: "NGD-120X" },
  { id: "ORD-88416", userId: "u10", productType: "book", productId: "bk-essay-sankalan", productTitle: "বাংলা রচনা সংকলন (Hardcopy)", amount: 380, method: "SSC", status: "REFUNDED", createdAt: "2026-01-25", txId: "SSC-8821" },
];

export const adminTopics = [
  { name: "BCS Preliminary", views: 48200, conversions: 1180 },
  { name: "NTRCA Package", views: 21400, conversions: 640 },
  { name: "English Grammar Masterclass", views: 18200, conversions: 520 },
  { name: "GK & Current Affairs", views: 16700, conversions: 410 },
  { name: "Bank Job Package", views: 14100, conversions: 380 },
  { name: "বাংলা রচনা সংকলন", views: 9800, conversions: 260 },
];

export const teacherEarnings = [
  { teacher: "Mahmudul Hasan", revenue: 1842000, students: 12840, courses: 12, payout: "Monthly" },
  { teacher: "Shirin Akter", revenue: 862400, students: 5290, courses: 7, payout: "Monthly" },
  { teacher: "Tanvir Ahmed", revenue: 1141000, students: 9620, courses: 6, payout: "Monthly" },
  { teacher: "Farida Islam", revenue: 491800, students: 8470, courses: 3, payout: "Quarterly" },
];