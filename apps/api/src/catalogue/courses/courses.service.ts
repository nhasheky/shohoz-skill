import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { slugify } from '../../common/slug.js';
import type { CreateCourseDto } from './dto/create-course.dto.js';
import type { UpdateCourseDto } from './dto/update-course.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      where: { published: true },
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(rawSlug: string) {
    const decoded = decodeURIComponent(rawSlug).trim();
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [
          { slug: rawSlug },
          { slug: decoded },
          { slug: { equals: decoded, mode: 'insensitive' } },
          { id: rawSlug },
          { id: decoded },
        ],
      },
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
    });
    if (!course || !course.published) throw new NotFoundException('Course not found.');
    return course;
  }

  private async resolveInstructorId(instructorId?: string | null): Promise<string | null> {
    if (!instructorId || !instructorId.trim()) return null;
    const trimmed = instructorId.trim();
    const byId = await this.prisma.instructor.findUnique({ where: { id: trimmed } });
    if (byId) return byId.id;
    const byName = await this.prisma.instructor.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (byName) return byName.id;
    const created = await this.prisma.instructor.create({
      data: {
        name: trimmed,
        title: 'Instructor',
        bio: 'Shohoz Skill Faculty',
      },
    });
    return created.id;
  }

  private sanitizeCourseScalars(scalars: Record<string, any>) {
    const clean: Record<string, any> = {};
    const stringFields = ['slug', 'title', 'titleBn', 'tagline', 'description', 'category', 'categoryBn', 'level', 'durationLabel', 'thumbnailUrl'];
    for (const f of stringFields) {
      if (scalars[f] !== undefined) {
        clean[f] = scalars[f] ? String(scalars[f]).trim() : null;
      }
    }
    const intFields = ['totalHours', 'lectures', 'quizzes', 'articles', 'resources', 'students', 'reviewCount'];
    for (const f of intFields) {
      if (scalars[f] !== undefined) {
        clean[f] = scalars[f] === '' || scalars[f] === null ? 0 : Math.round(Number(scalars[f])) || 0;
      }
    }
    if (scalars.rating !== undefined) {
      clean.rating = scalars.rating === '' || scalars.rating === null ? 0 : Number(scalars.rating) || 0;
    }
    const boolFields = ['certificate', 'featured', 'published'];
    for (const f of boolFields) {
      if (scalars[f] !== undefined) {
        clean[f] = Boolean(scalars[f]);
      }
    }
    const arrayFields = ['learningOutcomes', 'requirements', 'whoIsFor', 'allowedPaymentMethods'];
    for (const f of arrayFields) {
      if (scalars[f] !== undefined) {
        clean[f] = Array.isArray(scalars[f])
          ? scalars[f].map((x: any) => String(x ?? '').trim()).filter(Boolean)
          : typeof scalars[f] === 'string'
            ? scalars[f].split('\n').map((x: string) => x.trim()).filter(Boolean)
            : [];
      }
    }
    if (scalars.faq !== undefined) {
      clean.faq = scalars.faq && typeof scalars.faq === 'object' ? scalars.faq : null;
    }
    if (scalars.seo !== undefined) {
      clean.seo = scalars.seo && typeof scalars.seo === 'object' ? scalars.seo : null;
    }
    return clean;
  }

  private sanitizePrices(prices?: any[]) {
    if (!prices || !Array.isArray(prices)) return [];
    return prices
      .filter((p) => p && p.amount !== '' && p.amount !== undefined && p.amount !== null && !isNaN(Number(p.amount)))
      .map((p) => ({
        duration: String(p.duration || 'LIFETIME'),
        amount: Math.round(Number(p.amount)),
        originalAmount: p.originalAmount && !isNaN(Number(p.originalAmount)) ? Math.round(Number(p.originalAmount)) : null,
      }));
  }

  private sanitizeCurriculum(curriculum?: any[]) {
    if (!curriculum || !Array.isArray(curriculum)) return [];
    return curriculum
      .filter((sec) => sec && (sec.title || (sec.lessons && sec.lessons.length > 0)))
      .map((sec, i) => ({
        title: String(sec.title || `Section ${i + 1}`).trim(),
        sortOrder: Number(sec.sortOrder ?? i) || 0,
        lessons: sec.lessons?.length
          ? {
              create: sec.lessons
                .filter((l: any) => l && (l.title || l.sourceId))
                .map((l: any, j: number) => ({
                  title: String(l.title || `Lesson ${j + 1}`).trim(),
                  durationMinutes: Math.round(Number(l.durationMinutes)) || 0,
                  sourceKind: String(l.sourceKind || 'youtube'),
                  sourceId: String(l.sourceId || '').trim(),
                  preview: Boolean(l.preview),
                  sortOrder: Number(l.sortOrder ?? j) || 0,
                })),
            }
          : undefined,
      }));
  }

  /** Admin: create a course (with optional nested prices + curriculum). */
  async create(dto: CreateCourseDto) {
    const { prices, curriculum, instructorId, ...scalars } = dto;
    const cleanScalars = this.sanitizeCourseScalars(scalars);
    const resolvedInstructorId = await this.resolveInstructorId(instructorId);
    const cleanPrices = this.sanitizePrices(prices);
    const cleanCurriculum = this.sanitizeCurriculum(curriculum);

    const data: Prisma.CourseUncheckedCreateInput = {
      slug: await this.uniqueSlug(slugify(String(dto.slug ?? '').trim() || String(dto.title).trim())),
      title: String(dto.title).trim(),
      tagline: String(dto.tagline ?? '').trim(),
      description: String(dto.description ?? '').trim(),
      category: String(dto.category ?? '').trim(),
      ...cleanScalars,
      level: cleanScalars.level || 'All Levels',
      durationLabel: cleanScalars.durationLabel || 'self-paced',
      ...(resolvedInstructorId ? { instructorId: resolvedInstructorId } : {}),
      ...(cleanPrices.length ? { prices: { create: cleanPrices } } : {}),
      ...(cleanCurriculum.length ? { curriculum: { create: cleanCurriculum } } : {}),
    };

    return this.prisma.course.create({
      data,
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
    });
  }

  /** Admin: update a course. Nested relations are replaced when provided. */
  async update(id: string, dto: UpdateCourseDto) {
    await this.ensureExists(id);
    const { prices, curriculum, instructorId, slug: rawSlug, ...scalars } = dto;
    const cleanScalars = this.sanitizeCourseScalars(scalars);

    const data: Prisma.CourseUncheckedUpdateInput = {
      ...cleanScalars,
    };

    if (rawSlug !== undefined && String(rawSlug).trim()) {
      data.slug = await this.uniqueSlug(slugify(String(rawSlug).trim()), id);
    }

    if (instructorId !== undefined) {
      data.instructorId = await this.resolveInstructorId(instructorId);
    }

    if (prices !== undefined) {
      const cleanPrices = this.sanitizePrices(prices);
      data.prices = {
        deleteMany: {},
        create: cleanPrices,
      };
    }

    if (curriculum !== undefined) {
      const cleanCurriculum = this.sanitizeCurriculum(curriculum);
      data.curriculum = {
        deleteMany: {},
        create: cleanCurriculum,
      };
    }

    return this.prisma.course.update({
      where: { id },
      data,
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.course.delete({ where: { id } });
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.course.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Course not found.');
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = base || `course-${Date.now().toString(36)}`;
    let slug = root;
    let n = 2;
    while (
      await this.prisma.course.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      })
    ) {
      slug = `${root}-${n++}`;
    }
    return slug;
  }
}
