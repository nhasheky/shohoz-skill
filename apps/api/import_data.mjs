import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_DATABASE_URL;
const FILE = process.argv[2] || 'db-export.json';

if (!TARGET) {
  console.error('Missing TARGET_DATABASE_URL (the Hostneko Postgres URL).');
  process.exit(1);
}
if (!fs.existsSync(FILE)) {
  console.error(`Export file not found: ${path.resolve(FILE)}`);
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

const prisma = new PrismaClient({ datasources: { db: { url: TARGET } } });

async function main() {
  const dump = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const order = Array.isArray(dump.order) && dump.order.length ? dump.order : ORDER;
  const data = dump.data || {};

  let total = 0;
  for (const name of order) {
    const rows = Array.isArray(data[name]) ? data[name] : [];
    if (!rows.length) {
      console.log(`- ${name}: 0`);
      continue;
    }
    const delegate = prisma[name];
    if (!delegate) {
      console.warn(`- skip ${name} (unknown model)`);
      continue;
    }
    const res = await delegate.createMany({ data: rows, skipDuplicates: true });
    total += res.count;
    console.log(`+ ${name}: ${res.count}/${rows.length}`);
  }

  console.log(`\nImported ${total} rows into the target database.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
