-- Bring the catalogue tables in line with schema.prisma (thumbnail/demo columns
-- were added to the schema but never captured in a migration) and add support
-- for flexible book formats + owner-only full PDF content.
--
-- IF NOT EXISTS keeps this idempotent for databases that were previously
-- synced with `prisma db push`.

-- AlterTable Course
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;

-- AlterTable Exam
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;

-- AlterTable Book
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "demoPdfUrl" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "pdfFileUrl" TEXT;
ALTER TABLE "Book" ALTER COLUMN "pdfPrice" DROP NOT NULL;
