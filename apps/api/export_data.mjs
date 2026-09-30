import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const SOURCE = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const OUT = process.argv[2] || 'db-export.json';

if (!SOURCE) {
  console.error('Missing SOURCE_DATABASE_URL (or DATABASE_URL).');
  process.exit(1);
}

const ORDER = [
  'instructor',
  'user',
  'otpCode',
  'deviceSession',
  'course',
  'coursePrice',
  'curriculumSection',
  'lesson',
  'book',
  'exam',
  'examSubject',
  'examTopic',
  'question',
  'blogPost',
  'order',
  'enrollment',
  'progressItem',
  'examAttempt',
  'review',
  'siteSetting',
  'pageContent',
  'contactMessage',
];

const prisma = new PrismaClient({ datasources: { db: { url: SOURCE } } });

function mask(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return 'unknown';
  }
}

async function main() {
  const data = {};
  for (const name of ORDER) {
    const delegate = prisma[name];
    if (!delegate) {
      console.warn(`- skip ${name} (unknown model)`);
      continue;
    }
    data[name] = await delegate.findMany();
    console.log(`+ ${name}: ${data[name].length}`);
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    source: mask(SOURCE),
    order: ORDER,
    data,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
