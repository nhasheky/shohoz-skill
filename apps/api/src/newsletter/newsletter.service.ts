import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BulkSubscribersDto, SubscribeNewsletterDto, UpdateSubscriberDto } from './dto/newsletter.dto.js';

export type SubscribeMeta = { ip?: string; userAgent?: string };

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: capture a footer signup. A returning email is refreshed, not duplicated. */
  async subscribe(dto: SubscribeNewsletterDto, meta: SubscribeMeta = {}) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim() || null;
    const phone = dto.phone?.trim() || null;
    const source = dto.source?.trim() || 'footer';

    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        return this.prisma.newsletterSubscriber.update({
          where: { email },
          data: { status: 'SUBSCRIBED', name: name ?? existing.name, phone: phone ?? existing.phone, source },
        });
      }
      return existing;
    }

    try {
      return await this.prisma.newsletterSubscriber.create({
        data: { email, name, phone, source, ipAddress: meta.ip || null, userAgent: meta.userAgent || null },
      });
    } catch {
      const row = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (!row) throw new BadRequestException('This email could not be saved.');
      return row;
    }
  }

  /** Admin: paginated subscriber list with search + status filter. */
  async list(opts: { q?: string; status?: string; page?: number; perPage?: number }) {
    const page = Math.max(1, opts.page ?? 1);
    const perPage = Math.min(200, Math.max(1, opts.perPage ?? 20));
    const q = opts.q?.trim();
    const where: Prisma.NewsletterSubscriberWhereInput = {
      ...(opts.status && opts.status !== 'ALL' ? { status: opts.status } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, items, subscribed, unsubscribed] = await Promise.all([
      this.prisma.newsletterSubscriber.count({ where }),
      this.prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.newsletterSubscriber.count({ where: { status: 'SUBSCRIBED' } }),
      this.prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
    ]);

    return { total, page, perPage, items, counts: { total: subscribed + unsubscribed, subscribed, unsubscribed } };
  }

  /** Admin: every subscriber email (for copy / CSV export / campaign import). */
  emails(status = 'SUBSCRIBED') {
    return this.prisma.newsletterSubscriber.findMany({
      where: status && status !== 'ALL' ? { status } : {},
      orderBy: { createdAt: 'desc' },
      select: { email: true, name: true, phone: true, status: true, createdAt: true },
    });
  }

  async update(id: string, dto: UpdateSubscriberDto) {
    const exists = await this.prisma.newsletterSubscriber.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Subscriber not found.');
    return this.prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.newsletterSubscriber.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Subscriber not found.');
    await this.prisma.newsletterSubscriber.delete({ where: { id } });
    return { deleted: id };
  }

  async bulk(dto: BulkSubscribersDto) {
    if (!dto.ids?.length) throw new BadRequestException('No subscribers selected.');
    if (dto.action === 'DELETE') {
      const res = await this.prisma.newsletterSubscriber.deleteMany({ where: { id: { in: dto.ids } } });
      return { count: res.count, action: 'DELETE' as const };
    }
    const status = dto.status ?? 'SUBSCRIBED';
    const res = await this.prisma.newsletterSubscriber.updateMany({
      where: { id: { in: dto.ids } },
      data: { status },
    });
    return { count: res.count, action: 'STATUS' as const, status };
  }
}
