import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateCourseDto } from './dto/create-course.dto.js';
import type { UpdateCourseDto } from './dto/update-course.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      where: { published: true },
      include: { prices: true, instructor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
    });
    if (!course || !course.published) throw new NotFoundException('Course not found.');
    return course;
  }

  /** Admin: create a course (with optional nested prices + curriculum). */
  async create(dto: CreateCourseDto) {
    const { prices, curriculum, instructorId, ...scalars } = dto;
    // Strip empty strings from optional fields to avoid FK constraint violations
    const cleanScalars = Object.fromEntries(
      Object.entries(scalars).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    );
    const data: Prisma.CourseUncheckedCreateInput = {
      slug: dto.slug,
      title: dto.title,
      tagline: dto.tagline ?? '',
      description: dto.description ?? '',
      category: dto.category ?? '',
      ...cleanScalars,
      level: cleanScalars.level ?? 'All Levels',
      durationLabel: cleanScalars.durationLabel ?? 'self-paced',
      ...(instructorId ? { instructorId } : {}),
      ...(prices?.length
        ? { prices: { create: prices.map((p) => ({ duration: p.duration, amount: p.amount, originalAmount: p.originalAmount })) } }
        : {}),
      ...(curriculum?.length
        ? {
            curriculum: {
              create: curriculum.map((sec, i) => ({
                title: sec.title,
                sortOrder: sec.sortOrder ?? i,
                lessons: sec.lessons?.length
                  ? {
                      create: sec.lessons.map((l, j) => ({
                        title: l.title,
                        durationMinutes: l.durationMinutes,
                        sourceKind: l.sourceKind ?? 'youtube',
                        sourceId: l.sourceId ?? '',
                        preview: l.preview,
                        sortOrder: l.sortOrder ?? j,
                      })),
                    }
                  : undefined,
              })),
            },
          }
        : {}),
    };
    return this.prisma.course.create({
      data,
      include: { prices: true, instructor: true, curriculum: { include: { lessons: true } } },
    });
  }

  /** Admin: update a course. Nested relations are replaced when provided. */
  async update(id: string, dto: UpdateCourseDto) {
    await this.ensureExists(id);
    const { prices, curriculum, instructorId, ...scalars } = dto;
    // Strip empty strings from optional fields
    const cleanScalars = Object.fromEntries(
      Object.entries(scalars).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    );
    const data: Prisma.CourseUncheckedUpdateInput = {
      ...cleanScalars,
      ...(cleanScalars.level ? { level: cleanScalars.level } : {}),
      ...(instructorId ? { instructorId } : instructorId === '' ? { instructorId: null } : {}),
      ...(prices ? { prices: { deleteMany: {}, create: prices.map((p) => ({ duration: p.duration, amount: p.amount, originalAmount: p.originalAmount })) } } : {}),
      ...(curriculum
        ? {
            curriculum: {
              deleteMany: {},
              create: curriculum.map((sec, i) => ({
                title: sec.title,
                sortOrder: sec.sortOrder ?? i,
                lessons: sec.lessons?.length
                  ? {
                      create: sec.lessons.map((l, j) => ({
                        title: l.title,
                        durationMinutes: l.durationMinutes,
                        sourceKind: l.sourceKind ?? 'youtube',
                        sourceId: l.sourceId ?? '',
                        preview: l.preview,
                        sortOrder: l.sortOrder ?? j,
                      })),
                    }
                  : undefined,
              })),
            },
          }
        : {}),
    };
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
}
