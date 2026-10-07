# Shohoz Skill — Agent Guide

> Read this file at the start of every session. It defines the project, the
> conventions, and the **standing deployment workflow** the user expects.

## 0. Read this first (every session)

1. If `AGENTS.local.md` exists at the repo root, **read it immediately**. It holds
   machine-local deployment credentials, server paths and access method (it is
   gitignored and must never be committed).
2. `apps/web/AGENTS.md` is auto-managed by `next dev` — do not delete that block.

## 1. Project overview

Monorepo (npm workspaces) for the **Shohoz Skill LMS** — courses, MCQ exams
(with negative marking) and books, for the Bangladesh market.

| App | Path | Stack | Hosted on |
| --- | --- | --- | --- |
| Web frontend | `apps/web` | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 | **Vercel** |
| API | `apps/api` | NestJS 12 · Prisma · PostgreSQL · JWT + OTP | **Hostneko cPanel** (Phusion Passenger) |
| Shared | `packages/*` | reserved | — |

- **Database**: PostgreSQL running on the *same* Hostneko server
  (`localhost:5432`, db `shohozsk1_shohoz`). Connection string lives in
  `apps/api/.env.production`.
- **HARD RULE**: The full stack stays on **Vercel + Hostneko cPanel only**.
  Do **not** introduce Render, Neon, Railway, Supabase, Vercel Postgres, or any
  other DB/API host — the user explicitly does not want them.

### URLs
- Web: `https://shohozskill.com.bd` (+ `www`)
- API: `https://api.shohozskill.com.bd`

## 1b. Project map (memory — do NOT re-scan the whole repo)

This section is the persistent memory. Trust it; only open the specific file you
are about to edit. If you learn something new and important, append it here.

**Web — Next.js App Router (`apps/web/src/app`)**
- Public `(marketing)/`: `home`, `courses` → `course/[slug]` (+`learn`), `books`
  → `book/[slug]` (+`read` viewer), `exams` → `exam/[slug]` (+`take`), `blogs`
  → `blogs/[slug]`, `cart`, `checkout` (+`success`), `dashboard`, `login`,
  `register`, `contact`, `about`, `privacy`, `terms`.
- Admin `admin/`: `login`, `users`, `courses` (+`new`/`[id]`/`[id]/edit`), `books`,
  `exams`, `blogs`, `orders`, `coupons`, `categories`, `reviews`, `re-exam`,
  `blocked`, `incomplete`, `messages`, `pages`, `settings`, `marketing`.
- `api/send-email/route.ts` — email send endpoint.
- Libs: `src/lib/api.ts` (public client), `src/lib/admin-api.ts`, `src/lib/types.ts`
  (domain types), `src/lib/data/*` (legacy mock data, mirrors Prisma), `src/lib/site.ts`,
  `src/lib/pixel-snippets.ts` (pixel snippet builders), `src/lib/track.ts` (`trackEvent`).
- Components: `src/components/{admin,auth,brand,cart,dashboard,exam,layout,marketing,product,ui}`.
  `marketing/pixels.tsx` injects admin-managed pixels; `marketing/track-order.tsx` is the
  storefront order-tracking band rendered above the footer on every marketing page.
- `admin/pages` editor (in `admin-pages.tsx`) pre-fills each field with the **live default
  copy** (`HOME_DEFAULTS`/`ABOUT_DEFAULTS`/`CONTACT_DEFAULTS`) and shows a live-preview
  iframe, so the admin sees exactly which text each field maps to.
- `next.config.ts` permanently redirects old plural URLs → singular.

**API — NestJS (`apps/api/src`), global prefix `/api`**
- Modules: `auth`, `users`, `catalogue/{courses,books,exams}`, `orders`, `reviews`,
  `blogs`, `admin`, `cms`, `uploads`, `coupons`, `blocked`, `marketing`.
- Notable routes (all under `/api`):
  - `auth`: `register`, `login`, `verify-otp`, `resend-otp`, `otp/request`,
    `otp/verify`, `admin-login`, `set-password`, `sessions`, `sessions/:id`.
  - `users`: `me`, `me/enrollments`, `me/orders`, `me/progress`, `me/attempts`,
    `me/course-progress/:courseId`, plus admin user CRUD + `:id/overview`.
  - `courses`/`books`/`exams`: public `GET`, slug `GET`, admin `POST/PUT/DELETE`;
    books also `:id/content` (owner PDF) and `:id/demo`; exams also
    `:id/attempts`, `:id/my-attempt`, `:id/start`, `:id/re-exam`.
  - `orders`: `checkout`, `checkout-batch`, `coupon/validate`, `draft(s)`,
    `:id/poll`, `sslcommerz/diag`, `mine`, admin list/`summary`/`suggestions`,
    `:id/refund`, `:id/cancel`, `:id/status`, `bulk`, `steadfast/*`, and public
    `track?q=` (order no / phone / email).
  - `reviews` (+ `admin/reviews`), `blogs`, `cms` (`site-settings`, `pages/:page`,
    `contact-messages`), `coupons`, `blocked`, `uploads` (`init`/`:id/part`/`:id/complete`).
  - `marketing`: public `GET marketing/pixels` (enabled, secrets stripped),
    admin CRUD `admin/marketing/pixels`. `MetaCapiService` sends server-side
    Meta/Facebook **Purchase** events (Conversions API) on payment success,
    with optional advanced matching + test event code.
  - `admin`: `stats`, `users`, `users/:id/status`, `orders`, `analytics/revenue`,
    plus `courses`/`books`/`exams`/`blogs` list+detail.
- Entry: `main.ts` (prefix `api`, CORS from `WEB_ORIGIN`, static `/uploads`).
- Schema auto-migration: `src/prisma/prisma.service.ts` → `AUTO_MIGRATIONS`.
- Integrations: SSLCommerz (live), Steadfast courier, SMTP (`auth/mail.service.ts`).

**Data model (`apps/api/prisma/schema.prisma`)**
User, OtpCode, DeviceSession, Course, CoursePrice, CurriculumSection, Lesson,
Instructor, Book, Exam, ExamSubject, ExamTopic, Question, ExamStart, ReExamRequest,
BlogPost, Order, Coupon, Enrollment, ProgressItem, ExamAttempt, Review,
BlockedContact, CheckoutDraft, SiteSetting, PageContent, ContactMessage,
MarketingPixel.

**Continuity rules**
- Answer questions from this file first; open code only when editing a file.
- Keep this memory current: add new modules/routes/gotchas here as they appear.
- Use `opencode --continue` / `opencode -s <id>` to resume a previous session.

## 2. Standing deployment workflow (IMPORTANT)

The user expects the agent to **own deploys**. When the user gives a change and
says to update the site (or this is the clear intent), that is explicit approval
to **commit + push + deploy**. Follow this order:

1. Implement the change.
2. From repo root, verify, in this order:
   ```powershell
   npm run typecheck
   npm run lint
   npm run build        # web
   npm run build:api    # api (prisma generate + nest build)
   ```
   Fix anything that fails before deploying.
3. Commit with a clear conventional message (`feat(scope): ...`, `fix(scope): ...`).
4. Push to `origin/main`:
   ```powershell
   git push origin main
   ```
5. **Web (Vercel)**: pushing `main` triggers an automatic deploy. If
   `AGENTS.local.md` has `VERCEL_TOKEN`, you may also verify/force with the
   `vercel` CLI.
6. **API (Hostneko)**: run `scripts/deploy-api.ps1` (see §7). It builds, uploads
   `dist/` over FTP, restarts PM2 and health-checks. Manual equivalent:
   ```powershell
   npm run build:api
   # upload apps/api/dist/** -> /home/shohozsk1/api.shohozskill.com.bd/dist/  (FTP)
   # restart via the runner:
   #   cd /home/shohozsk1/api.shohozskill.com.bd && ./node_modules/.bin/pm2 restart shohoz-api
   ```
7. **DB schema changes**: the host runs no arbitrary SQL at deploy time, so add
   idempotent `ALTER/CREATE ... IF NOT EXISTS` statements to `AUTO_MIGRATIONS`
   in `apps/api/src/prisma/prisma.service.ts` — they apply on every boot.
   (`prisma migrate deploy` is also possible via the runner, but prefer the
   `AUTO_MIGRATIONS` pattern already in place.) Never run `migrate dev`/`db push`
   against production.
8. Report back: what changed, deploy status per host, and any follow-up.

If credentials are missing/blocked, stop and ask — do not fake a deploy.

## 3. Common commands (from repo root)

```powershell
npm install            # install all workspaces
npm run dev            # web on http://localhost:3000
npm run dev:api        # API on http://localhost:4000/api
npm run lint           # all workspaces
npm run typecheck      # all workspaces
npm run build          # web production build
npm run build:api      # API production build
npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev (LOCAL ONLY)
npm run db:deploy      # prisma migrate deploy (production)
npm run db:push        # prisma db push
npm run db:seed        # seed demo data
```

## 4. Environment files

| File | Purpose | Committed? |
| --- | --- | --- |
| `apps/api/.env` | local dev DB + JWT + sandbox gateways | no (gitignored) |
| `apps/api/.env.production` | prod DB, JWT, SSLCommerz live, URLs | **no (gitignored)** |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:4000` | no (gitignored) |
| `apps/web` on Vercel | set `NEXT_PUBLIC_API_URL=https://api.shohozskill.com.bd` | via Vercel dashboard |
| `AGENTS.local.md` | agent deploy creds & server paths | **no (gitignored)** |

**Never** print, commit, or paste secrets into tracked files or commit messages.

## 5. Code conventions

- Match existing patterns in the surrounding code; check neighbouring files first.
- Do **not** add comments unless asked.
- Web data currently flows through the API (`NEXT_PUBLIC_API_URL`); the older
  mock layer lives in `apps/web/src/lib/data/*`.
- Keep commits small and scoped.

## 6. Key files

- API entry (Passenger): `apps/api/app.js` → `import('./dist/main.js')`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Seed: `apps/api/prisma/seed.ts`
- Export/import helpers: `apps/api/export_data.mjs`, `apps/api/import_data.mjs`

## 7. API deploy details (Hostneko)

The API is a PM2 process `shohoz-api` running `dist/main.js` on port `3000`,
fronted by Apache. Access is via **FTP + an HTTP command runner** (SSH is closed,
the cPanel UI is behind Imunify360 and not scriptable). All host-specific values
live in `AGENTS.local.md`. Use `scripts/deploy-api.ps1`; it does:

1. `npm run build:api` (prisma generate + nest build) → `apps/api/dist`
2. Backup the live `dist` on the server, then FTP-upload the new `dist/**`
   to `/home/shohozsk1/api.shohozskill.com.bd/dist/`
3. FTP-upload `apps/api/prisma/schema.prisma` and run
   `./node_modules/.bin/prisma generate` on the server (the generated client
   lives on the server; `dist/` alone is not enough for new Prisma models)
4. Restart via the runner: `./node_modules/.bin/pm2 restart shohoz-api`
5. Health-check `https://api.shohozskill.com.bd/api/health`

If you change `apps/api/.env.production` or server `.env`, upload it too and
restart PM2 (env is read at boot).

