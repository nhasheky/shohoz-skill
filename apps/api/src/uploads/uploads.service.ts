import { BadRequestException, Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

// Files are streamed to disk in small chunks so uploads can exceed the web
// server's per-request body cap (the public host rejects requests > 128MB),
// and to keep huge PDFs out of Postgres entirely.
const UPLOADS_DIR = join(process.cwd(), 'uploads');
const PARTS_DIR = join(UPLOADS_DIR, '.parts');
const ID_RE = /^[a-f0-9]{32}$/;

@Injectable()
export class UploadsService {
  private ensureDirs() {
    mkdirSync(PARTS_DIR, { recursive: true });
  }

  init() {
    this.ensureDirs();
    const id = randomBytes(16).toString('hex');
    writeFileSync(join(PARTS_DIR, `${id}.part`), Buffer.alloc(0));
    return { uploadId: id };
  }

  append(id: string, chunk: Buffer) {
    if (!ID_RE.test(id)) throw new BadRequestException('Invalid upload id.');
    const part = join(PARTS_DIR, `${id}.part`);
    if (!existsSync(part)) throw new BadRequestException('Unknown upload session.');
    appendFileSync(part, chunk);
    return { received: chunk.length };
  }

  complete(id: string, ext = 'bin') {
    if (!ID_RE.test(id)) throw new BadRequestException('Invalid upload id.');
    const safeExt = String(ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
    const part = join(PARTS_DIR, `${id}.part`);
    if (!existsSync(part)) throw new BadRequestException('Unknown upload session.');
    mkdirSync(UPLOADS_DIR, { recursive: true });
    const filename = `${id}.${safeExt}`;
    renameSync(part, join(UPLOADS_DIR, filename));
    return { url: this.publicUrl(filename), filename };
  }

  private publicUrl(filename: string) {
    const base = (process.env.API_URL ?? 'https://api.shohozskill.com.bd')
      .replace(/\/+$/, '')
      .replace(/\/api$/, '');
    return `${base}/uploads/${filename}`;
  }
}
