import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { slugify } from '../../common/slug.js';
import type { CreateBookDto } from './dto/create-book.dto.js';
import type { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lightweight public list — never ships the (potentially huge) PDF payloads. */
  async findAll() {
    return this.prisma.book.findMany({
      where: { published: true },
      omit: { pdfFileUrl: true, demoPdfUrl: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(rawSlug: string) {
    const decoded = decodeURIComponent(rawSlug).trim();
    const book = await this.prisma.book.findFirst({
      where: {
        OR: [
          { slug: rawSlug },
          { slug: decoded },
          { slug: { equals: decoded, mode: 'insensitive' } },
          { id: rawSlug },
          { id: decoded },
        ],
      },
      omit: { pdfFileUrl: true },
    });
    if (!book || !book.published) throw new NotFoundException('Book not found.');
    // Ship a light flag instead of the (potentially huge) sample PDF payload.
    const { demoPdfUrl, ...rest } = book;
    return { ...rest, hasDemo: Boolean(demoPdfUrl) };
  }

  /** Public sample PDF (opened from the cover) — no auth required. */
  async demo(idOrSlug: string) {
    const decoded = decodeURIComponent(idOrSlug).trim();
    const book = await this.prisma.book.findFirst({
      where: { OR: [{ id: idOrSlug }, { id: decoded }, { slug: idOrSlug }, { slug: decoded }] },
      select: { demoPdfUrl: true },
    });
    if (!book?.demoPdfUrl) throw new NotFoundException('No sample PDF for this book.');
    return { pdfUrl: book.demoPdfUrl };
  }

  /**
   * Full book PDF for the authenticated reader. Only the owner (a user with a
   * paid/enrolled copy) receives the content — it is never exposed publicly.
   */
  async content(idOrSlug: string, userId: string) {
    const decoded = decodeURIComponent(idOrSlug).trim();
    const book = await this.prisma.book.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { id: decoded }, { slug: idOrSlug }, { slug: decoded }],
      },
      select: { id: true, slug: true, title: true, pdfFileUrl: true },
    });
    if (!book) throw new NotFoundException('Book not found.');
    if (!book.pdfFileUrl) throw new NotFoundException('This book has no online PDF.');

    const enrolled = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        productType: 'book',
        productId: { in: [book.id, book.slug] },
      },
      select: { id: true },
    });
    if (!enrolled) throw new ForbiddenException('You do not own this book.');

    return { id: book.id, slug: book.slug, title: book.title, pdfUrl: book.pdfFileUrl };
  }

  private sanitizeBookScalars(dto: Record<string, any>) {
    const clean: Record<string, any> = {};
    const stringFields = ['title', 'titleBn', 'subtitle', 'description', 'category', 'author', 'publisher', 'edition', 'language', 'thumbnailUrl', 'demoPdfUrl', 'pdfFileUrl'];
    for (const f of stringFields) {
      if (dto[f] !== undefined) {
        clean[f] = dto[f] ? String(dto[f]).trim() : null;
      }
    }
    const intFields = ['pages', 'pdfPrice', 'hardcopyPrice', 'samplePages', 'students', 'reviewCount'];
    const nullableIntFields = ['pdfPrice', 'hardcopyPrice']; // empty ⇒ format not sold
    for (const f of intFields) {
      if (dto[f] !== undefined) {
        if (nullableIntFields.includes(f) && (dto[f] === '' || dto[f] === null)) {
          clean[f] = null;
        } else {
          clean[f] = Math.round(Number(dto[f])) || 0;
        }
      }
    }
    if (dto.rating !== undefined) {
      clean.rating = Number(dto.rating) || 0;
    }
    const boolFields = ['featured', 'published'];
    for (const f of boolFields) {
      if (dto[f] !== undefined) {
        clean[f] = Boolean(dto[f]);
      }
    }
    if (dto.allowedPaymentMethods !== undefined) {
      clean.allowedPaymentMethods = Array.isArray(dto.allowedPaymentMethods)
        ? dto.allowedPaymentMethods.map((x: any) => String(x ?? '').trim()).filter(Boolean)
        : [];
    }
    if (dto.seo !== undefined) {
      clean.seo = dto.seo && typeof dto.seo === 'object' ? dto.seo : null;
    }

    // Format exclusivity: a book is either an online PDF or a printed hardcopy.
    if (clean.pdfPrice !== undefined || clean.hardcopyPrice !== undefined) {
      const pdf = clean.pdfPrice ?? null;
      const hard = clean.hardcopyPrice ?? null;
      if (pdf != null && hard != null) {
        throw new BadRequestException('Choose either an online PDF price or a hardcopy price — not both.');
      }
      if (pdf != null) {
        clean.hardcopyPrice = null;
      } else if (hard != null) {
        // Hardcopy books only ship the free demo; never a full online PDF.
        clean.pdfPrice = null;
        clean.pdfFileUrl = null;
      }
    }
    return clean;
  }

  async create(dto: CreateBookDto) {
    const clean = this.sanitizeBookScalars(dto as any);
    if (clean.pdfPrice != null && !clean.pdfFileUrl) {
      throw new BadRequestException('Upload the full PDF file when selling the online PDF.');
    }
    return this.prisma.book.create({
      data: {
        slug: await this.uniqueSlug(slugify(String(dto.slug ?? '').trim() || String(dto.title).trim())),
        title: String(dto.title).trim(),
        description: String(dto.description ?? '').trim(),
        category: String(dto.category ?? '').trim(),
        author: String(dto.author ?? '').trim(),
        edition: String(dto.edition ?? '1st Edition').trim(),
        publisher: String(dto.publisher ?? 'Shohoz Skill').trim(),
        pages: Math.round(Number(dto.pages)) || 0,
        ...clean,
      },
      omit: { pdfFileUrl: true, demoPdfUrl: true },
    });
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.ensureExists(id);
    const { slug: rawSlug, ...rest } = dto;
    const clean = this.sanitizeBookScalars(rest as any);
    if (clean.pdfPrice != null && clean.pdfFileUrl === undefined) {
      const existing = await this.prisma.book.findUnique({ where: { id }, select: { pdfFileUrl: true } });
      if (!existing?.pdfFileUrl) {
        throw new BadRequestException('Upload the full PDF file when selling the online PDF.');
      }
    }
    if (rawSlug !== undefined && String(rawSlug).trim()) {
      clean.slug = await this.uniqueSlug(slugify(String(rawSlug).trim()), id);
    }
    return this.prisma.book.update({ where: { id }, data: clean, omit: { pdfFileUrl: true, demoPdfUrl: true } });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.book.delete({ where: { id } });
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.book.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Book not found.');
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = base || `book-${Date.now().toString(36)}`;
    let slug = root;
    let n = 2;
    while (
      await this.prisma.book.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      })
    ) {
      slug = `${root}-${n++}`;
    }
    return slug;
  }
}
