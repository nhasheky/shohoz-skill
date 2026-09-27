# @shohoz/api — Shohoz Skill backend

NestJS 12 · Prisma 6 · PostgreSQL · JWT + OTP auth · vitest.

## Run

```bash
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npm install
npm run db:generate
npm run db:migrate          # or db:push
npm run db:seed
npm run start:dev           # http://localhost:4000/api
```

## Modules

| Module | Responsibility |
| --- | --- |
| `auth` | OTP request/verify, JWT issuance, device-limit (max 2 sessions), session revoke |
| `users` | profile, enrollments, orders, progress, exam attempts |
| `catalogue` | courses, books, exams (package → subject → topic → questions) |
| `orders` | create order → gateway handoff, **poll** endpoint, refund, auto-enrollment on paid |
| `reviews` | public approved listing + PENDING moderation flow |
| `blogs` | published listing + detail |
| `admin` | stats, users (suspend/activate), orders, review moderation, revenue series |

Guards: `JwtAuthGuard` + `RolesGuard` (SUPER_ADMIN / ADMIN / TEACHER / STUDENT) with a `@Roles()` decorator. Validation via global `ValidationPipe` (whitelist + transform).

## Database

Prisma schema at `prisma/schema.prisma` (models: User, OtpCode, DeviceSession, Course (+prices/curriculum/lessons), Instructor, Book, Exam (+subjects/topics/questions), BlogPost, Order, Enrollment, ProgressItem, ExamAttempt, Review). Seed at `prisma/seed.ts` via `tsx`.

## Notes

- Payments are **mocked** in `OrdersService.poll` — swap in real bKash/Nagad/SSLCommerz calls.
- Rate limiting is intentionally omitted until `@nestjs/throttler` supports Nest 12.
