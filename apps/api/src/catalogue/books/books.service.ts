import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateBookDto } from './dto/create-book.dto.js';
import type { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.book.findMany({
      where: { published: true },
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
    });
    if (!book || !book.published) throw new NotFoundException('Book not found.');
    return book;
  }

  private sanitizeBookScalars(dto: Record<string, any>) {
    const clean: Record<string, any> = {};
    const stringFields = ['slug', 'title', 'titleBn', 'subtitle', 'description', 'category', 'author', 'publisher', 'edition', 'language', 'thumbnailUrl', 'demoPdfUrl'];
    for (const f of stringFields) {
      if (dto[f] !== undefined) {
        clean[f] = dto[f] ? String(dto[f]).trim() : null;
      }
    }
    const intFields = ['pages', 'pdfPrice', 'hardcopyPrice', 'samplePages', 'students', 'reviewCount'];
    for (const f of intFields) {
      if (dto[f] !== undefined) {
        if (f === 'hardcopyPrice' && (dto[f] === '' || dto[f] === null || dto[f] === undefined)) {
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
    return clean;
  }

  async create(dto: CreateBookDto) {
    const clean = this.sanitizeBookScalars(dto as any);
    return this.prisma.book.create({
      data: {
        slug: String(dto.slug).trim(),
        title: String(dto.title).trim(),
        description: String(dto.description ?? '').trim(),
        category: String(dto.category ?? '').trim(),
        author: String(dto.author ?? '').trim(),
        edition: String(dto.edition ?? '1st Edition').trim(),
        publisher: String(dto.publisher ?? 'Shohoz Skill').trim(),
        pages: Math.round(Number(dto.pages)) || 0,
        pdfPrice: Math.round(Number(dto.pdfPrice)) || 0,
        ...clean,
      },
    });
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.ensureExists(id);
    const clean = this.sanitizeBookScalars(dto as any);
    return this.prisma.book.update({ where: { id }, data: clean });
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
}
