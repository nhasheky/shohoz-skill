/**
 * Shohoz Skill — admin API client (client-side only).
 *
 * Authenticated fetch helpers for the admin panel. Reads the JWT from
 * localStorage (issued by the OTP login flow). Throws on failure so the
 * admin UI can fall back to demo mode.
 */
import type { Order, AppUser, SiteSetting, PageContent, ContactMessage, MarketingPixel } from "@/lib/types";

export const TOKEN_KEY = "shohoz_token";
export const ROLE_KEY = "shohoz_role";

export type AdminSession = { token: string; role: string; name: string };

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  if (!token) return null;
  return { token, role: role ?? "STUDENT", name: "" };
}

export function setAdminSession(token: string, role: string, name = "") {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem("shohoz_name", name);
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem("shohoz_name");
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd").replace(/\/api\/?$/, "").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getAdminSession();
  if (!session) throw new ApiError(401, "Not authenticated");
  const method = (options.method ?? "GET").toUpperCase();
  const url =
    method === "GET"
      ? `${API_URL}/api${path}${path.includes("?") ? "&" : "?"}_t=${Date.now()}`
      : `${API_URL}/api${path}`;
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * Upload a large file (e.g. a book PDF) to the API in small chunks so it stays
 * under the web host's per-request body cap, then return the public file URL.
 */
export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const session = getAdminSession();
  if (!session) throw new ApiError(401, "Not authenticated");
  const auth = { Authorization: `Bearer ${session.token}` };
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";

  const initRes = await fetch(`${API_URL}/api/uploads/init`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size }),
  });
  if (!initRes.ok) throw new ApiError(initRes.status, `Upload failed (${initRes.status})`);
  const { uploadId } = (await initRes.json()) as { uploadId: string };

  const CHUNK = 16 * 1024 * 1024;
  let index = 0;
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    const slice = file.slice(offset, Math.min(offset + CHUNK, file.size));
    const form = new FormData();
    form.append("chunk", slice, `chunk-${index}`);
    const res = await fetch(`${API_URL}/api/uploads/${uploadId}/part`, { method: "POST", headers: auth, body: form });
    if (!res.ok) throw new ApiError(res.status, `Upload failed (${res.status})`);
    index++;
    onProgress?.(Math.min(99, Math.round((index * CHUNK * 100) / Math.max(file.size, 1))));
  }

  const doneRes = await fetch(`${API_URL}/api/uploads/${uploadId}/complete`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ ext, name: file.name }),
  });
  if (!doneRes.ok) throw new ApiError(doneRes.status, `Upload failed (${doneRes.status})`);
  onProgress?.(100);
  return ((await doneRes.json()) as { url: string }).url;
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export async function adminVerifyOtp(phone: string, code: string) {
  const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, code, deviceName: "Admin Panel (Shohoz Skill)" }),
  });
  if (!res.ok) throw new ApiError(res.status, `Login failed (${res.status})`);
  const data = (await res.json()) as { accessToken: string; user: { id: string; name?: string; role: string } };
  return data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export const getAdminStats = () => request<Record<string, number | string>>("/admin/stats");
export const getAdminRevenue = () => request<{ month: string; revenue: number }[]>("/admin/analytics/revenue");

// ─── Catalogue ────────────────────────────────────────────────────────────
export type PageResult<T> = { total: number; page: number; perPage: number; items: T[] };

export const listCourses = (q?: string, page = 1, perPage = 20) =>
  request<PageResult<Record<string, unknown>>>(`/admin/courses${qs({ q, page, perPage })}`);
export const getCourse = (id: string) => request<Record<string, unknown>>(`/admin/courses/${id}`);
export const createCourse = (dto: Record<string, unknown>) =>
  request("/courses", { method: "POST", body: JSON.stringify(dto) });
export const updateCourse = (id: string, dto: Record<string, unknown>) =>
  request(`/courses/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteCourse = (id: string) => request(`/courses/${id}`, { method: "DELETE" });

export const listBooks = (q?: string, page = 1, perPage = 20) =>
  request<PageResult<Record<string, unknown>>>(`/admin/books${qs({ q, page, perPage })}`);
export const getBook = (id: string) => request<Record<string, unknown>>(`/admin/books/${id}`);
export const createBook = (dto: Record<string, unknown>) =>
  request("/books", { method: "POST", body: JSON.stringify(dto) });
export const updateBook = (id: string, dto: Record<string, unknown>) =>
  request(`/books/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteBook = (id: string) => request(`/books/${id}`, { method: "DELETE" });

export const listExams = (q?: string, page = 1, perPage = 20) =>
  request<PageResult<Record<string, unknown>>>(`/admin/exams${qs({ q, page, perPage })}`);
export const getExam = (id: string) => request<Record<string, unknown>>(`/admin/exams/${id}`);
export const createExam = (dto: Record<string, unknown>) =>
  request("/exams", { method: "POST", body: JSON.stringify(dto) });
export const updateExam = (id: string, dto: Record<string, unknown>) =>
  request(`/exams/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteExam = (id: string) => request(`/exams/${id}`, { method: "DELETE" });

export const listBlogs = (q?: string, page = 1, perPage = 20) =>
  request<PageResult<Record<string, unknown>>>(`/admin/blogs${qs({ q, page, perPage })}`);
export const getBlog = (id: string) => request<Record<string, unknown>>(`/admin/blogs/${id}`);
export const createBlog = (dto: Record<string, unknown>) =>
  request("/blogs", { method: "POST", body: JSON.stringify(dto) });
export const updateBlog = (id: string, dto: Record<string, unknown>) =>
  request(`/blogs/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteBlog = (id: string) => request(`/blogs/${id}`, { method: "DELETE" });

// ─── Coupons ──────────────────────────────────────────────────────────────
export type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  appliesTo: string[];
  active: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

export const listCoupons = () => request<Coupon[]>("/admin/coupons");
export const createCoupon = (dto: Record<string, unknown>) =>
  request<Coupon>("/admin/coupons", { method: "POST", body: JSON.stringify(dto) });
export const updateCoupon = (id: string, dto: Record<string, unknown>) =>
  request<Coupon>(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteCoupon = (id: string) => request(`/admin/coupons/${id}`, { method: "DELETE" });

// ─── Users ────────────────────────────────────────────────────────────────
export const listUsers = (q?: string, page = 1, perPage = 20) =>
  request<PageResult<AppUser>>(`/users${qs({ q, page, perPage })}`);
export const updateUser = (id: string, dto: Partial<AppUser>) =>
  request<AppUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteUser = (id: string) => request(`/users/${id}`, { method: "DELETE" });

export type UserOverview = {
  enrollments: { id: string; productType: string; productId: string; title: string; giftFrom?: string | null; viaAdmin?: boolean; createdAt: string }[];
  orders: { id: string; orderNumber?: number | null; productTitle: string; amount: number; total?: number | null; status: string; createdAt: string }[];
  attempts: { id: string; exam?: { title: string } | null; score: number; maxMarks: number; passed: boolean; submittedAt: string }[];
};
export const getUserOverview = (id: string) => request<UserOverview>(`/users/${id}/overview`);
export const revokeEnrollment = (userId: string, enrollmentId: string) =>
  request(`/users/${userId}/enrollments/${enrollmentId}`, { method: "DELETE" });
export const grantEnrollment = (userId: string, productType: string, productId: string) =>
  request(`/users/${userId}/enrollments`, { method: "POST", body: JSON.stringify({ productType, productId }) });

// ─── Re-exam requests ─────────────────────────────────────────────────────
export type ReExamRequest = {
  id: string;
  userId: string;
  examId: string;
  status: string;
  note?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  user?: { id: string; name: string; phone: string } | null;
  exam?: { id: string; title: string; slug: string } | null;
};
export const listReExamRequests = (status = "PENDING") =>
  request<ReExamRequest[]>(`/admin/re-exam-requests?status=${status}`);
export const approveReExam = (id: string) => request(`/admin/re-exam-requests/${id}/approve`, { method: "PUT" });
export const rejectReExam = (id: string) => request(`/admin/re-exam-requests/${id}/reject`, { method: "PUT" });

// ─── Orders ───────────────────────────────────────────────────────────────
export const listOrders = (status?: string, page = 1, perPage = 20, q?: string) =>
  request<PageResult<Order>>(`/orders${qs({ status, page, perPage, q })}`);
export const setOrderStatus = (id: string, status: Order["status"]) =>
  request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
export const updateOrder = (id: string, dto: Record<string, unknown>) =>
  request(`/orders/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteOrder = (id: string) => request(`/orders/${id}`, { method: "DELETE" });
export const bulkOrders = (ids: string[], action: "DELETE" | "STATUS", status?: string) =>
  request<{ count: number; action: string; status?: string }>("/orders/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action, status }),
  });
export const steadfastBalance = () => request<{ current_balance?: number }>("/orders/steadfast/balance");
export const sendToSteadfast = (id: string) =>
  request<{ trackingCode?: string | null; consignmentId?: string | null; status?: string | null }>(`/orders/${id}/steadfast`, { method: "POST" });
export const refreshCourier = (id: string) =>
  request<{ delivery_status?: string | null }>(`/orders/${id}/steadfast/refresh`, { method: "POST" });
export const refreshAllCouriers = () =>
  request<{ checked: number; updated: number }>("/orders/steadfast/refresh-all", { method: "POST" });

// ─── Incomplete (abandoned) checkouts ─────────────────────────────────────
export type CheckoutDraft = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  region?: string | null;
  paymentMethod?: string | null;
  items?: unknown;
  note?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
};
export const listDrafts = () => request<CheckoutDraft[]>("/orders/drafts");
export const deleteDraft = (id: string) => request(`/orders/drafts/${id}`, { method: "DELETE" });

// ─── Blocked customers (fraud) ────────────────────────────────────────────
export type BlockedContact = {
  id: string;
  type: "PHONE" | "IP";
  value: string;
  reason?: string | null;
  createdAt: string;
};
export const listBlocked = () => request<BlockedContact[]>("/admin/blocked");
export const addBlocked = (dto: { type: "PHONE" | "IP"; value: string; reason?: string }) =>
  request<BlockedContact>("/admin/blocked", { method: "POST", body: JSON.stringify(dto) });
export const removeBlocked = (id: string) => request(`/admin/blocked/${id}`, { method: "DELETE" });

// ─── Reviews ──────────────────────────────────────────────────────────────
export type AdminReview = {
  id: string;
  productType: string;
  productId: string;
  rating: number;
  text: string;
  imageUrl?: string | null;
  status: string;
  authorName?: string | null;
  createdAt: string;
  user?: { name?: string | null; nameBn?: string | null; phone?: string | null } | null;
};

export const listReviews = (status = "ALL", page = 1, perPage = 200) =>
  request<PageResult<AdminReview>>(`/admin/reviews${qs({ status, page, perPage })}`);
export const createReview = (dto: Record<string, unknown>) =>
  request<AdminReview>("/admin/reviews", { method: "POST", body: JSON.stringify(dto) });
export const updateReview = (id: string, dto: Record<string, unknown>) =>
  request<AdminReview>(`/admin/reviews/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteReview = (id: string) => request(`/admin/reviews/${id}`, { method: "DELETE" });
export const approveReview = (id: string) => request(`/admin/reviews/${id}/approve`, { method: "PUT" });
export const rejectReview = (id: string) => request(`/admin/reviews/${id}/reject`, { method: "PUT" });

// ─── CMS: site settings ───────────────────────────────────────────────────
export const getSiteSettings = () => request<SiteSetting>("/admin/site-settings");
export const updateSiteSettings = (dto: Partial<SiteSetting>) =>
  request<SiteSetting>("/admin/site-settings", { method: "PUT", body: JSON.stringify(dto) });

// ─── CMS: editable pages ──────────────────────────────────────────────────
export const listPages = () => request<PageContent[]>("/admin/pages");
export const getPage = (page: string) => request<PageContent>(`/admin/pages/${page}`);
export const updatePage = (page: string, data: Record<string, unknown>) =>
  request<PageContent>(`/admin/pages/${page}`, { method: "PUT", body: JSON.stringify({ data }) });

// ─── CMS: contact messages ────────────────────────────────────────────────
export const listContactMessages = (status?: string, page = 1, perPage = 20) =>
  request<PageResult<ContactMessage>>(`/admin/contact-messages${qs({ status, page, perPage })}`);
export const setContactMessageStatus = (id: string, status: ContactMessage["status"]) =>
  request(`/admin/contact-messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteContactMessage = (id: string) =>
  request(`/admin/contact-messages/${id}`, { method: "DELETE" });

// ─── Marketing pixels ─────────────────────────────────────────────────────
export const listMarketingPixels = () => request<MarketingPixel[]>("/admin/marketing/pixels");
export const createMarketingPixel = (dto: Partial<MarketingPixel>) =>
  request<MarketingPixel>("/admin/marketing/pixels", { method: "POST", body: JSON.stringify(dto) });
export const updateMarketingPixel = (id: string, dto: Partial<MarketingPixel>) =>
  request<MarketingPixel>(`/admin/marketing/pixels/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteMarketingPixel = (id: string) =>
  request(`/admin/marketing/pixels/${id}`, { method: "DELETE" });
