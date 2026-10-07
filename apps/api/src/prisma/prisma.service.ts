import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Idempotent schema safety net.
 *
 * Some deployments run on shared hosting where `prisma migrate deploy` /
 * `db push` cannot be executed manually. These statements bring the database
 * in line with `schema.prisma` automatically on boot. They are additive and
 * safe to run on every start (`IF NOT EXISTS` / dropping a NOT NULL is a no-op
 * when already applied) and a failure never prevents the API from starting.
 */
const AUTO_MIGRATIONS: string[] = [
  `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT`,
  `ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT`,
  `ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT`,
  `ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "demoPdfUrl" TEXT`,
  `ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "pdfFileUrl" TEXT`,
  `ALTER TABLE "Book" ALTER COLUMN "pdfPrice" DROP NOT NULL`,
  // Coupons + multi-item (cart) order support.
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponCode" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discount" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "items" JSONB`,
  `CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PERCENT',
    "value" INTEGER NOT NULL,
    "minSubtotal" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "appliesTo" TEXT[] NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code")`,
  `CREATE INDEX IF NOT EXISTS "Coupon_active_idx" ON "Coupon"("active")`,
  // Reviews: admin-authored entries (nullable user), photos, edited timestamps.
  `ALTER TABLE "Review" ALTER COLUMN "userId" DROP NOT NULL`,
  `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "authorName" TEXT`,
  `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`,
  `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  // Admin-controllable reviews carousel speed.
  `ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "reviewScrollSeconds" INTEGER NOT NULL DEFAULT 6`,
  // Admin-picked suggested products (course/book/exam).
  `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "suggested" JSONB`,
  `ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "suggested" JSONB`,
  `ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "suggested" JSONB`,
  // Human-friendly order numbers starting at 34586.
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber")`,
  `CREATE SEQUENCE IF NOT EXISTS "OrderNumber_seq" START WITH 34586`,
  `DO $$ DECLARE r RECORD; BEGIN FOR r IN SELECT id FROM "Order" WHERE "orderNumber" IS NULL ORDER BY "createdAt" LOOP UPDATE "Order" SET "orderNumber" = nextval('"OrderNumber_seq"') WHERE id = r.id; END LOOP; END $$`,
  // Steadfast courier fields.
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "consignmentId" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingCode" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courierStatus" TEXT`,
  // Fraud / audit info.
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "device" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userAgent" TEXT`,
  `CREATE TABLE IF NOT EXISTS "BlockedContact" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedContact_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BlockedContact_type_value_key" ON "BlockedContact"("type","value")`,
  `CREATE INDEX IF NOT EXISTS "BlockedContact_type_idx" ON "BlockedContact"("type")`,
  `CREATE TABLE IF NOT EXISTS "CheckoutDraft" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "region" TEXT,
    "paymentMethod" TEXT,
    "items" JSONB,
    "note" TEXT,
    "ipAddress" TEXT,
    "device" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutDraft_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CheckoutDraft_createdAt_idx" ON "CheckoutDraft"("createdAt")`,
  // Course gifts + enrollment gift label.
  `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "gift" JSONB`,
  `ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "giftFrom" TEXT`,
  // Re-exam requests.
  `CREATE TABLE IF NOT EXISTS "ReExamRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "ReExamRequest_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ReExamRequest_status_idx" ON "ReExamRequest"("status")`,
  `CREATE INDEX IF NOT EXISTS "ReExamRequest_userId_examId_idx" ON "ReExamRequest"("userId","examId")`,
  // Exam start times (persistent countdown).
  `CREATE TABLE IF NOT EXISTS "ExamStart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamStart_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExamStart_userId_examId_key" ON "ExamStart"("userId","examId")`,
  `CREATE INDEX IF NOT EXISTS "ExamStart_examId_idx" ON "ExamStart"("examId")`,
  // Marketing / tracking pixels.
  `CREATE TABLE IF NOT EXISTS "MarketingPixel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "pixelId" TEXT,
    "headCode" TEXT,
    "bodyCode" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingPixel_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "MarketingPixel_enabled_idx" ON "MarketingPixel"("enabled")`,
  // Meta Conversions API + advanced matching fields.
  `ALTER TABLE "MarketingPixel" ADD COLUMN IF NOT EXISTS "capiToken" TEXT`,
  `ALTER TABLE "MarketingPixel" ADD COLUMN IF NOT EXISTS "testEventCode" TEXT`,
  `ALTER TABLE "MarketingPixel" ADD COLUMN IF NOT EXISTS "advancedMatching" BOOLEAN NOT NULL DEFAULT false`,
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureSchema() {
    for (const statement of AUTO_MIGRATIONS) {
      try {
        await this.$executeRawUnsafe(statement);
      } catch (err) {
        this.logger.warn(`Auto-migration skipped: ${statement} — ${(err as Error)?.message}`);
      }
    }
  }
}
