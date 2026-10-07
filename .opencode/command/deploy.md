---
description: Build, commit, push and deploy the current changes (web → Vercel, API → Hostneko).
agent: shohoz
---

Run the Shohoz Skill standing deployment workflow from `AGENTS.md §2` for the
current changes in this repo.

Extra instruction from the user (may be empty): $ARGUMENTS

Steps:
1. Show `git status` and `git diff` and confirm the changes are intended.
2. Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build:api`
   from the repo root; fix anything that fails.
3. Commit with a clear conventional message and `git push origin main`.
4. Web → confirm the Vercel deploy (auto from `main`; use VERCEL_TOKEN only if set).
5. API → `powershell -ExecutionPolicy Bypass -File scripts\deploy-api.ps1`.
6. If there are schema changes, add idempotent SQL to `AUTO_MIGRATIONS` in
   `apps/api/src/prisma/prisma.service.ts` before step 5.
7. Report the outcome per host and any follow-up.
