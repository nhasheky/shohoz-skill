/**
 * Shohoz Skill — admin API client (client-side only).
 *
 * Authenticated fetch helpers for the admin panel. Reads the JWT from
 * localStorage (issued by the OTP login flow). Throws on failure so the
 * admin UI can fall back to demo mode.
 */
import type { Order, AppUser } from "@/lib/types";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://shohoz-api.onrender.com";

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
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
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

// ─── Users ────────────────────────────────────────────────────────────────
export const listUsers = (q?: string, page = 1, perPage = 20) =>
  request<PageResult<AppUser>>(`/users${qs({ q, page, perPage })}`);
export const updateUser = (id: string, dto: Partial<AppUser>) =>
  request<AppUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const deleteUser = (id: string) => request(`/users/${id}`, { method: "DELETE" });

// ─── Orders ───────────────────────────────────────────────────────────────
export const listOrders = (status?: string, page = 1, perPage = 20) =>
  request<PageResult<Order>>(`/orders${qs({ status, page, perPage })}`);
export const setOrderStatus = (id: string, status: Order["status"]) =>
  request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// ─── Reviews ──────────────────────────────────────────────────────────────
export const listReviews = (status = "PENDING", page = 1, perPage = 20) =>
  request<PageResult<Record<string, unknown>>>(`/reviews${qs({ status, page, perPage })}`);
export const approveReview = (id: string) => request(`/reviews/${id}/approve`, { method: "PUT" });
export const rejectReview = (id: string) => request(`/reviews/${id}/reject`, { method: "PUT" });
