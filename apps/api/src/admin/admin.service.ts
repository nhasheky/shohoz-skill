import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [totalUsers, newUsers30d, activeSubscriptions, revenueAgg, pendingReviews, pendingOrders, refunds30d] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { joinedAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
        this.prisma.enrollment.count(),
        this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
        this.prisma.review.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count({ where: { status: 'REFUNDED', refundedAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
      ]);

    return {
      totalUsers,
      newUsers30d,
      activeSubscriptions,
      totalRevenueBdt: revenueAgg._sum.amount ?? 0,
      pendingReviews,
      pendingOrders,
      refunds30d,
    };
  }

  async users(query?: string, page = 1, perPage = 20) {
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { devices: true },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { joinedAt: 'desc' },
      }),
    ]);
    return { total, page, perPage, items };
  }

  async setUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') {
    await this.prisma.user.update({ where: { id: userId }, data: { status } });
    return { id: userId, status };
  }

  async orders(page = 1, perPage = 20, status?: string) {
    const where = status ? { status } : {};
    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { user: { select: { id: true, name: true, nameBn: true, phone: true, email: true } } },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page, perPage, items };
  }

  async moderateReview(reviewId: string, status: 'APPROVED' | 'REJECTED') {
    return this.prisma.review.update({ where: { id: reviewId }, data: { status } });
  }

  async revenueSeries() {
    const rows = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      select: { amount: true, createdAt: true },
    });
    const byMonth = new Map<string, number>();
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + r.amount);
    }
    return [...byMonth.entries()].map(([month, revenue]) => ({ month, revenue }));
  }

  // ── Catalogue management (includes unpublished items) ────────────────────

  private async paginate<T extends object>(
    find: (skip: number, take: number) => Promise<T[]>,
    count: () => Promise<number>,
    page = 1,
    perPage = 20,
  ) {
    const [total, items] = await Promise.all([
      count(),
      find((page - 1) * perPage, perPage),
    ]);
    return { total, page, perPage, items };
  }

  async courses(q?: string, page = 1, perPage = 20) {
    const where = q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] }
      : {};
    return this.paginate(
      (skip, take) =>
        this.prisma.course.findMany({ where, include: { prices: true, instructor: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      () => this.prisma.course.count({ where }),
      page,
      perPage,
    );
  }

  async books(q?: string, page = 1, perPage = 20) {
    const where = q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] }
      : {};
    return this.paginate(
      (skip, take) => this.prisma.book.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      () => this.prisma.book.count({ where }),
      page,
      perPage,
    );
  }

  async exams(q?: string, page = 1, perPage = 20) {
    const where = q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] }
      : {};
    return this.paginate(
      (skip, take) =>
        this.prisma.exam.findMany({ where, include: { subjects: { include: { topics: true } } }, skip, take, orderBy: { createdAt: 'desc' } }),
      () => this.prisma.exam.count({ where }),
      page,
      perPage,
    );
  }

  async blogs(q?: string, page = 1, perPage = 20) {
    const where = q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] }
      : {};
    return this.paginate(
      (skip, take) => this.prisma.blogPost.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      () => this.prisma.blogPost.count({ where }),
      page,
      perPage,
    );
  }

  // ── Single-item admin getters (full nesting for edit forms) ──────────────
  async courseById(id: string) {
    const row = await this.prisma.course.findUnique({
      where: { id },
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
    });
    if (!row) throw new NotFoundException('Course not found.');
    return row;
  }

  async bookById(id: string) {
    const row = await this.prisma.book.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Book not found.');
    return row;
  }

  async examById(id: string) {
    const row = await this.prisma.exam.findUnique({
      where: { id },
      include: { subjects: { include: { topics: { include: { questions: true } } } } },
    });
    if (!row) throw new NotFoundException('Exam not found.');
    return row;
  }

  async blogById(id: string) {
    const row = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Blog post not found.');
    return row;
  }
}
