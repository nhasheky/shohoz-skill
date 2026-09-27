# Shohoz Skill (সহজ স্কিল)

> **Learn to Earn** — Bangladesh's fastest learning platform for government-job preparation: courses, MCQ exams with real negative marking, and books.

Monorepo for the Shohoz Skill LMS platform.

## Stack

| App | Path | Tech |
| --- | --- | --- |
| Web frontend | `apps/web` | Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · React 19 |
| API | `apps/api` | NestJS 12 · Prisma · PostgreSQL · JWT + OTP auth |
| Shared (future) | `packages/*` | npm workspaces |

## Quick start

```bash
npm install          # hoisted to the root node_modules
npm run dev          # web app on http://localhost:3000
npm run dev:api      # API on http://localhost:4000/api
```

### API + database

```bash
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL + JWT_SECRET
npm run db:generate
npm run db:migrate      # or db:push to scaffold without migration files
npm run db:seed         # demo admin/teacher/student + a course, exam, book, blog
```

Demo accounts after seeding:

- Admin: `+8801700000001`
- Teacher: `+8801700000002`
- Student: `+8801712345678`

## What's built (frontend)

- Marketing: home (hero, stats, categories, testimonials, FAQ, CTA), courses, books, exams (packages + standalone), blogs, about, contact (working form), privacy, terms.
- Course detail: curriculum accordion, instructor, duration/price plans, reviews, FAQ, sticky enroll CTA.
- Book detail + secure **PDF reader** (watermark overlay, right-click/keyboard deterrents, preview-lock, two-page spread).
- Exam engine: package → subject → topic hierarchy, **full exam-taking session** (timer, question palette, flagging, negative marking) → instant results with per-question explanations.
- Auth: OTP login/register flow (mock) → student dashboard (enrollments, progress, orders, results, device management with the 2-device limit).
- Admin panel: dashboard, revenue chart, users (suspend/activate), orders, teachers, analytics + CMS placeholders.

## What's wired in the API

`auth` (OTP + JWT + device-limit), `users` (me/enrollments/orders/progress/attempts), `catalogue` (courses/books/exams), `orders` (create + gateway **poll** + refund), `reviews` (public list + moderated create), `blogs`, `admin` (stats/users/orders/revenue/moderation).

## Scripts

```bash
npm run lint          # all workspaces
npm run typecheck     # all workspaces
npm run build         # web production build
npm run build:api     # API build
```

## Notes

- The frontend runs on **mock data** (`apps/web/src/lib/data/*`) until the API endpoints are connected. The mock layer mirrors the Prisma schema 1:1.
- Brand tokens (navy `#0D2A4E`, gold `#F2A93B`, sky `#7FC4E8`) and the logo are **placeholders** — replace with the final brand kit.
- Payments are simulated (no real gateway); the poll endpoint shows the intended bKash/Nagad/SSLCommerz contract.
