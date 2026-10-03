import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { slugify } from '../../common/slug.js';
import type { CreateExamDto } from './dto/create-exam.dto.js';
import type { UpdateExamDto } from './dto/update-exam.dto.js';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.exam.findMany({
      where: { published: true },
      include: { subjects: { include: { topics: { include: { questions: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(rawSlug: string) {
    const decoded = decodeURIComponent(rawSlug).trim();
    const exam = await this.prisma.exam.findFirst({
      where: {
        OR: [
          { slug: rawSlug },
          { slug: decoded },
          { slug: { equals: decoded, mode: 'insensitive' } },
          { id: rawSlug },
          { id: decoded },
        ],
      },
      include: {
        subjects: { include: { topics: { include: { questions: true } } } },
      },
    });
    if (!exam || !exam.published) throw new NotFoundException('Exam not found.');
    return exam;
  }

  private sanitizeExamScalars(dto: Record<string, any>) {
    const clean: Record<string, any> = {};
    const stringFields = ['title', 'titleBn', 'tagline', 'description', 'examType', 'difficulty', 'thumbnailUrl'];
    for (const f of stringFields) {
      if (dto[f] !== undefined) {
        clean[f] = dto[f] ? String(dto[f]).trim() : null;
      }
    }
    const intFields = ['priceAmount', 'priceOriginalAmount', 'durationMinutes', 'questionsCount', 'totalMarks', 'marksPerQuestion', 'attemptCount'];
    for (const f of intFields) {
      if (dto[f] !== undefined) {
        if (f === 'priceOriginalAmount' && (dto[f] === '' || dto[f] === null || dto[f] === undefined)) {
          clean[f] = null;
        } else {
          clean[f] = Math.round(Number(dto[f])) || 0;
        }
      }
    }
    const floatFields = ['defaultNegativeMarks', 'passRate', 'avgScore', 'rating'];
    for (const f of floatFields) {
      if (dto[f] !== undefined) {
        clean[f] = Number(dto[f]) || 0;
      }
    }
    const boolFields = ['isFree', 'negativeMarking', 'featured', 'published'];
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
    if (dto.suggested !== undefined) {
      clean.suggested = Array.isArray(dto.suggested)
        ? dto.suggested
            .filter((s: any) => s && typeof s.type === 'string' && typeof s.id === 'string')
            .map((s: any) => ({ type: String(s.type), id: String(s.id) }))
        : null;
    }
    return clean;
  }

  private sanitizeSubjects(subjects?: any[]) {
    if (!subjects || !Array.isArray(subjects)) return [];
    return subjects
      .filter((s) => s && (s.title || (s.topics && s.topics.length > 0)))
      .map((s, i) => ({
        title: String(s.title || `Subject ${i + 1}`).trim(),
        sortOrder: Number(s.sortOrder ?? i) || 0,
        topics: s.topics?.length
          ? {
              create: s.topics
                .filter((t: any) => t && t.title)
                .map((t: any, j: number) => ({
                  title: String(t.title).trim(),
                  slug: String(t.slug || `topic-${i + 1}-${j + 1}`).trim(),
                  questionsCount: Math.round(Number(t.questionsCount)) || (t.questions?.length ?? 0),
                  durationMinutes: Math.round(Number(t.durationMinutes)) || 0,
                  marksPerQuestion: Math.round(Number(t.marksPerQuestion)) || 1,
                  negativeMarks: Number(t.negativeMarks ?? 0.25) || 0,
                  sortOrder: Number(t.sortOrder ?? j) || 0,
                  questions: t.questions?.length
                    ? {
                        create: t.questions
                          .filter((q: any) => q && q.text)
                          .map((q: any, k: number) => ({
                            text: String(q.text).trim(),
                            options: Array.isArray(q.options)
                              ? q.options
                              : typeof q.options === 'string'
                                ? (() => { try { return JSON.parse(q.options); } catch { return [q.options]; } })()
                                : [],
                            answerIndex: Math.round(Number(q.answerIndex)) || 0,
                            explanation: q.explanation ? String(q.explanation).trim() : null,
                            sortOrder: Number(q.sortOrder ?? k) || 0,
                          })),
                      }
                    : undefined,
                })),
            }
          : undefined,
      }));
  }

  async create(dto: CreateExamDto) {
    const { subjects, ...scalars } = dto;
    const cleanScalars = this.sanitizeExamScalars(scalars as any);
    const cleanSubjects = this.sanitizeSubjects(subjects);

    return this.prisma.exam.create({
      data: {
        slug: await this.uniqueSlug(slugify(String(dto.slug ?? '').trim() || String(dto.title).trim())),
        title: String(dto.title).trim(),
        tagline: String(dto.tagline ?? '').trim(),
        description: String(dto.description ?? '').trim(),
        ...cleanScalars,
        ...(cleanSubjects.length ? { subjects: { create: cleanSubjects } } : {}),
      },
      include: { subjects: { include: { topics: { include: { questions: true } } } } },
    });
  }

  async update(id: string, dto: UpdateExamDto) {
    await this.ensureExists(id);
    const { subjects, slug: rawSlug, ...scalars } = dto;
    const cleanScalars = this.sanitizeExamScalars(scalars as any);

    const data: Prisma.ExamUncheckedUpdateInput = {
      ...cleanScalars,
    };

    if (rawSlug !== undefined && String(rawSlug).trim()) {
      data.slug = await this.uniqueSlug(slugify(String(rawSlug).trim()), id);
    }

    if (subjects !== undefined) {
      const cleanSubjects = this.sanitizeSubjects(subjects);
      data.subjects = {
        deleteMany: {},
        create: cleanSubjects,
      };
    }

    return this.prisma.exam.update({
      where: { id },
      data,
      include: { subjects: { include: { topics: { include: { questions: true } } } } },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.exam.delete({ where: { id } });
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.exam.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Exam not found.');
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = base || `exam-${Date.now().toString(36)}`;
    let slug = root;
    let n = 2;
    while (
      await this.prisma.exam.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      })
    ) {
      slug = `${root}-${n++}`;
    }
    return slug;
  }
}
