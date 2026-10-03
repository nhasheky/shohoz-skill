import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { devices: { orderBy: { lastActive: 'desc' } } },
    });
    if (!user) throw new NotFoundException('User not found.');
    const { password, ...safe } = user;
    void password;
    return safe;
  }

  async myEnrollments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollments.length) return [];

    const courseIds = enrollments.filter(e => e.productType === 'course').map(e => e.productId);
    const bookIds = enrollments.filter(e => e.productType === 'book').map(e => e.productId);
    const examIds = enrollments.filter(e => e.productType === 'exam').map(e => e.productId);

    const [courses, books, exams, progressItems] = await Promise.all([
      courseIds.length
        ? this.prisma.course.findMany({
            where: { OR: [{ id: { in: courseIds } }, { slug: { in: courseIds } }] },
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnailUrl: true,
              curriculum: { select: { lessons: { select: { id: true } } } },
            },
          })
        : [],
      bookIds.length
        ? this.prisma.book.findMany({
            where: { OR: [{ id: { in: bookIds } }, { slug: { in: bookIds } }] },
            select: { id: true, slug: true, title: true, thumbnailUrl: true },
          })
        : [],
      examIds.length
        ? this.prisma.exam.findMany({
            where: { OR: [{ id: { in: examIds } }, { slug: { in: examIds } }] },
            select: { id: true, slug: true, title: true, thumbnailUrl: true },
          })
        : [],
      this.prisma.progressItem.findMany({ where: { userId } }),
    ]);

    const courseMap = new Map<string, { id: string; slug: string; title: string; thumbnailUrl: string | null }>();
    const lessonTotal = new Map<string, number>();
    for (const c of courses) {
      courseMap.set(c.id, c);
      courseMap.set(c.slug, c);
      lessonTotal.set(c.id, c.curriculum.reduce((n, s) => n + s.lessons.length, 0));
    }

    // Completed lessons per course (progress rows with lessonId at 100%).
    const completedByCourse = new Map<string, number>();
    for (const p of progressItems) {
      if (p.lessonId && p.percent >= 100) {
        completedByCourse.set(p.productId, (completedByCourse.get(p.productId) ?? 0) + 1);
      }
    }

    const bookMap = new Map<string, { id: string; slug: string; title: string; thumbnailUrl: string | null }>();
    for (const b of books) {
      bookMap.set(b.id, b);
      bookMap.set(b.slug, b);
    }

    const examMap = new Map<string, { id: string; slug: string; title: string; thumbnailUrl: string | null }>();
    for (const x of exams) {
      examMap.set(x.id, x);
      examMap.set(x.slug, x);
    }

    const progressMap = new Map<string, number>();
    for (const p of progressItems) {
      progressMap.set(p.productId, p.percent);
    }

    return enrollments.map(e => {
      let product: { id: string; slug: string; title: string; thumbnailUrl: string | null } | undefined;
      if (e.productType === 'course') product = courseMap.get(e.productId);
      else if (e.productType === 'book') product = bookMap.get(e.productId);
      else if (e.productType === 'exam') product = examMap.get(e.productId);

      let progress = progressMap.get(e.productId) ?? 0;
      if (e.productType === 'course') {
        const total = product ? lessonTotal.get(product.id) ?? 0 : 0;
        const done = completedByCourse.get(e.productId) ?? completedByCourse.get(product?.id ?? '') ?? 0;
        progress = total ? Math.round((done / total) * 100) : progress;
      }

      return {
        ...e,
        title: product?.title || e.productId,
        slug: product?.slug || e.productId,
        thumbnailUrl: product?.thumbnailUrl ?? null,
        progress,
      };
    });
  }

  // ─── Course lesson progress ────────────────────────────────────────────────
  private async courseLessonCount(courseIdOrSlug: string): Promise<number> {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
      select: { id: true },
    });
    if (!course) return 0;
    return this.prisma.lesson.count({ where: { section: { courseId: course.id } } });
  }

  async courseProgress(userId: string, courseIdOrSlug: string) {
    const total = await this.courseLessonCount(courseIdOrSlug);
    const items = await this.prisma.progressItem.findMany({
      where: { userId, productId: courseIdOrSlug, lessonId: { not: null } },
      select: { lessonId: true, percent: true },
    });
    const completed = items.filter((i) => i.percent >= 100).length;
    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
      lessons: items.map((i) => ({ lessonId: i.lessonId, percent: i.percent })),
    };
  }

  async setLessonProgress(userId: string, courseId: string, lessonId: string, completed: boolean) {
    const percent = completed ? 100 : 0;
    await this.prisma.progressItem.upsert({
      where: { userId_productId_lessonId: { userId, productId: courseId, lessonId } },
      create: { userId, productId: courseId, lessonId, percent },
      update: { percent },
    });
    return this.courseProgress(userId, courseId);
  }

  // ─── Admin: a user's full activity + revoke access ─────────────────────────
  async adminOverview(id: string) {
    await this.ensureExists(id);
    const [enrollments, orders, attempts] = await Promise.all([
      this.prisma.enrollment.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.examAttempt.findMany({ where: { userId: id }, include: { exam: { select: { title: true } } }, orderBy: { submittedAt: 'desc' }, take: 25 }),
    ]);

    // Resolve titles for enrollments.
    const courseIds = enrollments.filter((e) => e.productType === 'course').map((e) => e.productId);
    const bookIds = enrollments.filter((e) => e.productType === 'book').map((e) => e.productId);
    const examIds = enrollments.filter((e) => e.productType === 'exam').map((e) => e.productId);
    const [courses, books, exams] = await Promise.all([
      courseIds.length ? this.prisma.course.findMany({ where: { OR: [{ id: { in: courseIds } }, { slug: { in: courseIds } }] }, select: { id: true, slug: true, title: true } }) : [],
      bookIds.length ? this.prisma.book.findMany({ where: { OR: [{ id: { in: bookIds } }, { slug: { in: bookIds } }] }, select: { id: true, slug: true, title: true } }) : [],
      examIds.length ? this.prisma.exam.findMany({ where: { OR: [{ id: { in: examIds } }, { slug: { in: examIds } }] }, select: { id: true, slug: true, title: true } }) : [],
    ]);
    const titles = new Map<string, string>();
    for (const r of [...courses, ...books, ...exams]) {
      titles.set(r.id, r.title);
      titles.set(r.slug, r.title);
    }

    return {
      enrollments: enrollments.map((e) => ({ ...e, title: titles.get(e.productId) ?? e.productId })),
      orders,
      attempts,
    };
  }

  async revokeEnrollment(userId: string, enrollmentId: string) {
    const enr = await this.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, select: { id: true } });
    if (!enr) throw new NotFoundException('Enrollment not found.');
    await this.prisma.enrollment.delete({ where: { id: enrollmentId } });
    return { deleted: enrollmentId };
  }

  async grantEnrollmentAdmin(userId: string, productType: string, productId: string, viaAdmin = true) {
    await this.ensureExists(userId);
    return this.prisma.enrollment.upsert({
      where: { userId_productType_productId: { userId, productType, productId } },
      create: { userId, productType, productId, accessFrom: new Date(), viaAdmin },
      update: { viaAdmin },
    });
  }

  async myOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myProgress(userId: string) {
    return this.prisma.progressItem.findMany({ where: { userId } });
  }

  async myAttempts(userId: string) {
    return this.prisma.examAttempt.findMany({
      where: { userId },
      include: { exam: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 25,
    });
  }

  /** Admin: paginated user listing with optional search. */
  async findAll(query?: string, page = 1, perPage = 20) {
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
        include: { devices: { orderBy: { lastActive: 'desc' } } },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { joinedAt: 'desc' },
      }),
    ]);
    const safeItems = items.map(({ password: _pw, ...safe }) => safe);
    return { total, page, perPage, items: safeItems };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { devices: { orderBy: { lastActive: 'desc' } } },
    });
    if (!user) throw new NotFoundException('User not found.');
    const { password, ...safe } = user;
    void password;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    const { password, ...rest } = dto;
    const user = await this.prisma.user.update({
      where: { id },
      data: password ? { ...rest, password: password } : rest,
    });
    const { password: _pw, ...safe } = user;
    void _pw;
    return safe;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.$transaction([
      // Order & Enrollment have no ON DELETE cascade — remove them explicitly.
      this.prisma.order.deleteMany({ where: { userId: id } }),
      this.prisma.enrollment.deleteMany({ where: { userId: id } }),
      // The rest cascade via the schema.
      this.prisma.user.delete({ where: { id } }),
    ]);
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('User not found.');
  }
}
