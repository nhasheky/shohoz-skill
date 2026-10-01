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
