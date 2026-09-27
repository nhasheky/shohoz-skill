# @shohoz/web — Shohoz Skill frontend

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · React 19.

## Run

```bash
npm run dev        # http://localhost:3000
npm run build
npm run lint
npm run typecheck
```

## Structure

- `src/app/` — routes: marketing pages, `/dashboard`, `/admin`, exam `[slug]/take`, book `[slug]/read`.
- `src/components/` — `ui` (buttons, icons, covers, cards), `layout` (navbar/footer/background), `marketing`, `product` (purchase dialog/panel, video player, PDF reader), `exam` (exam session), `auth`, `dashboard`, `admin`.
- `src/lib/` — domain types, site config, formatters, and the **mock data layer** (`data/*`) that mirrors the Prisma schema.
- Theme: class-based dark mode, persisted under the `shohoz-theme` localStorage key (inline `ThemeScript` prevents flash).

## Key flows (mock-backed until the API is connected)

- **Checkout**: `PurchaseDialog` simulates bKash/Nagad/Rocket/Card with a gateway poll → success/error.
- **Exam session**: `ExamSession` runs a timed, negatively-marked MCQ paper and renders a full results breakdown with explanations.
- **PDF reader**: `PdfReader` renders watermarked pages with copy/print/screenshot deterrents and a free-preview lock.

Covers, logos and brand hex codes are placeholders.
