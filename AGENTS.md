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
- Admin auth uses **separate** localStorage keys (`shohoz_admin_token`/`_role`/`_name`)
  from the public site (`shohoz_token`), and `admin-api` clears + redirects to
  `/admin/login` on any 401 — public login/logout can no longer clobber the admin session.
- **Book landing page**: `book/[slug]/page.tsx` is a CartFlows-style landing page —
  big admin `headline` → `subheading` → cover (click = demo PDF) → `shortDescription`
  → `videoUrl` (YouTube/Vimeo/mp4) → `landingImageUrl` → full `description` → the
  free demo PDF **auto-loads inline** (`BookAutoDemo`, no click) → reviews → an
  embedded `BookOrderForm` (price, delivery charge, payment, coupon + the
  "এখানে ক্লিক দিয়ে অর্ডার কনফার্ম করুন" button) → suggestions. All hero fields are
  optional and fall back to title/subtitle for older books.
- **Theme defaults to light** for the whole site (`ThemeProvider` + `ThemeScript`);
  dark is opt-in via the navbar `ThemeToggle` (persisted in `shohoz-theme`).
- `next.config.ts` permanently redirects old plural URLs → singular.
- **Performance**: `src/lib/api.ts` caches public reads in Next's Data Cache
  (`next.revalidate`, 60s) and only calls `cookies()`/`no-store` for `{ auth: true }`
  reads — so `/`, `/about`, `/contact`, blog posts etc. render as static/ISR (only
  `searchParams`/auth pages stay dynamic). After any admin write, `admin-api` POSTs
  `/api/revalidate` (verifies the admin token against the API) to bust the cache
  instantly. **Never store images as base64 `data:` URLs** — they inline into every
  HTML payload and bloat pages (one homepage was 3.4MB). Uploaders now post to the
  API `/uploads` and store the returned URL.

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

**Hosting status (2026-10-14 — read before any deploy)**
- Account is **`shohozsk1`** on **`trex.infernodns.com` = `152.228.223.226`** (the server the user
  "changed" to). `141.95.34.163` is a **secondary IP of the same box** (not a different server). See `AGENTS.local.md`.
- **Web (Vercel) is LIVE again**: Hostneko's server move had reset apex to the cPanel IP (site was
  serving an autoindex), so the agent re-pointed `@` A → `216.198.79.1` and `www` → apex via the
  cPanel DNS API (run from inside the box). `api` A stays on the Hostneko IP.
- **API is LIVE (200 OK)** — PostgreSQL on `127.0.0.1:5432` is configured with `?sslmode=disable`
  (required because the local PostgreSQL has SSL disabled, preventing Prisma Rust engine panic).
  All 33 schema tables migrated and populated with seed data.
  Endpoints (`/api/health`, `/api/courses`, `/api/books`, `/api/exams`, `/api/auth/admin-login`) verified working.
- **Deploy channel is no longer FTP** (port 21 closed, SSH closed, cPanel UI sits behind
  Imunify360): use the on-server HTTP **runner + uploader** (`AGENTS.local.md` → "Agent channels").
  PM2 is legacy and has been stopped; Passenger is the runtime.
- Pre-existing crons/leftovers on the box: a `*/5` `pm2 resurrect` cron (safe to remove), a legacy
  `^api/` reverse-proxy rule in `public_html/.htaccess` (port 3000 no longer used).

**Connectivity verified 2026-10-15 (all channels live)**
- Web `https://shohozskill.com.bd` → Vercel (`Server: Vercel`, `X-Vercel-Id: bom1::iad1::…`, 200 on `/`,
  `/courses`, `/books`, `/exams`, `/blogs`, `/login`, `/dashboard`, `/admin/login`).
- API `https://api.shohozskill.com.bd/api/health` → `{"status":"ok"}`; `/api/courses|books|exams|blogs` 200.
  (Public CMS route is `GET /api/site-settings` — there is **no** `/api/cms/site-settings`; that 404 is normal.)
- Runner + uploader both work (`whoami` = shohozsk1, upload test OK). `~/shz_cp.sh` (cPanel UAPI from inside
  the box) works: `Variables/get_user_information`, `PassengerApps/list_applications` verified.
  `/home/shohozsk1` and `/home/shohozsk1/api.shohozskill.com.bd` are **writable** by the runner.
- `git push origin main` auth OK (dry-run "Everything up-to-date"; local = `origin/main` = `4963a8e`).
- Passenger app config gotcha: `PassengerApps/list_applications` reports nodejs `/usr/bin/node-22` which does
  **not exist**; the live runtime is still node20 because `api.shohozskill.com.bd/.htaccess`
  (`PassengerNodejs /opt/alt/alt-nodejs20/…`) wins. Don't "fix" that cPanel entry.
- **Prod DB content = seed only** (2026-10-15): User 4 (2× SUPER_ADMIN with password set:
  `admin@shohozskill.com`, `nazmulhasanasheky@gmail.com`; TEACHER/STUDENT have `password = NULL`),
  Course/Book/Exam/BlogPost 1 each, **PageContent 0**, Order/Coupon/Review/Enrollment/Pixel 0.
  Site content therefore needs a full re-entry (settings + CMS pages + catalogue), then it reads live.
- Housekeeping: 26 stale `dist.bak.*` dirs (~40 MB) in the API dir; box load average 7–8.

**Newsletter (2026-10-15)** — footer signup → admin panel → email campaigns.
- API: public `POST /api/newsletter` (`{email,name?,phone?,source?}`, email lowercased, unique, re-subscribe on
  returning address), admin (`ADMIN`/`SUPER_ADMIN`) `GET /api/admin/newsletter?q=&status=&page=&perPage=`
  (+ `counts`), `GET /api/admin/newsletter/emails?status=` (for copy/CSV), `POST /api/admin/newsletter/bulk`
  (`DELETE` | `STATUS`), `PUT/DELETE /api/admin/newsletter/:id`. Module `apps/api/src/newsletter/`.
- Table `NewsletterSubscriber` (created by `AUTO_MIGRATIONS`, no manual SQL needed).
- Web: `components/layout/newsletter-form.tsx` (client, in `layout/footer.tsx` above the copyright row, fires
  Meta/TikTok `Lead` via `@/lib/track`); admin UI `/admin/newsletter`
  (`components/admin/newsletter-page.tsx`, sidebar item "Newsletter").

**API deploy gotchas learned 2026-10-15**
- The HTTP runner kills long commands (~30s) with a 500 "Request Timeout". `prisma generate` on the box must be
  backgrounded: `nohup <node20> ./node_modules/prisma/build/index.js generate > ~/shz-prisma-gen.log 2>&1 &`
  then poll the log (takes ~6s).
- `dist` upload recipe that works: `tar -czf shz-dist.tar.gz dist` (run inside `apps/api`), upload to `$HOME` via
  `shz_upload.php`, then on the box `cd api.shohozskill.com.bd && mv dist dist.bak.$(date +%s) && tar xzf ../shz-dist.tar.gz`.
  Upload `prisma/schema.prisma` directly to `api.shohozskill.com.bd/prisma/schema.prisma` (the uploader mkdirs).
- `api.shohozskill.com.bd/passenger.log` only receives app-crash output and is NOT touched by normal request
  errors — don't read it as a request log.

**Continuity rules**
- Answer questions from this file first; open code only when editing a file.
- Keep this memory current: add new modules/routes/gotchas here as they appear.
- Use `opencode --continue` / `opencode -s <id>` to resume a previous session.
- **Never rewrite source files with PowerShell `Get-Content -Raw` + `Set-Content`** —
  PS 5.1 reads a BOM-less UTF-8 file as ANSI and silently corrupts Bengali/emoji
  (mojibake). Use the `edit` tool. If a script must write, read AND write with
  `-Encoding UTF8` (and prefer `-Encoding utf8NoBOM`). Saved CMS rows can inherit
  mojibake too — re-check `PageContent` after such a mistake.

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
6. **API (Hostneko)**: **FTP is gone — do not use `scripts/deploy-api.ps1`.** Use the on-server
   HTTP runner + uploader (see §7). Manual equivalent:
   ```powershell
   npm run build:api
   # tar apps/api/dist -> upload via shz_upload.php -> extract over .../api.shohozskill.com.bd/dist
   # upload prisma/schema.prisma, run ./node_modules/.bin/prisma generate on the box
   # restart Passenger:  mkdir -p tmp && touch tmp/restart.txt
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

The API runs as a **Passenger** app (`Shohoz API`, domain `api.shohozskill.com.bd`, startup file
`app.js` → `dist/main.js`, Node 20 from `/opt/alt/alt-nodejs20`). FTP (21), SSH (22) and the cPanel
UI from outside are all closed/challenged, so everything goes through two HTTP endpoints that live in
`public_html` of the account (**keys/paths in `AGENTS.local.md`**), called against the server IP with
`-k` + `Host: shohozskill.com.bd`:

- **runner** `shz_runner.php` — `bash -lc` as the user (`b64=<base64(cmd)>`); `shell_exec` is enabled.
- **uploader** `shz_upload.php` — `-F dest=<path under $HOME> -F file=@local` (no FTP needed).

Deploy recipe:

1. `npm run build:api` (prisma generate + nest build) → `apps/api/dist`
2. Back up + replace the live `dist` on the box:
   ```powershell
   # tar/zip apps/api/dist, upload via shz_upload.php, then on the box:
   #   cd api.shohozskill.com.bd && mv dist dist.bak.$(date +%s) && tar xzf ../shz-dist.tar.gz
   ```
3. Upload `apps/api/prisma/schema.prisma` and run `./node_modules/.bin/prisma generate` on the box
   (the generated client lives on the server; `dist/` alone is not enough for new Prisma models).
4. Restart Passenger: `cd /home/shohozsk1/api.shohozskill.com.bd && mkdir -p tmp && touch tmp/restart.txt`
5. Health-check `https://api.shohozskill.com.bd/api/health` (expects `{"status":"ok"}`; 503 = app died
   at boot, check `passenger.log` in the app dir; `P1010`/`P1001` = DB not reachable → Hostneko).

If you change `apps/api/.env.production`, upload it as `.env` and touch `tmp/restart.txt` (env is read at
boot). PM2 (`shohoz-api`, `~/.pm2`, the `*/5` `pm2 resurrect` cron) is legacy — leave it stopped.

