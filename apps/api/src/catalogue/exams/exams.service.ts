import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  /** Save a completed exam attempt for the signed-in user. */
  async saveAttempt(userId: string, examIdOrSlug: string, dto: { score: number; maxMarks: number; correct: number; wrong: number; unanswered: number; passed: boolean; topicId?: string; answers?: unknown }) {
    const exam = await this.prisma.exam.findFirst({
      where: { OR: [{ id: examIdOrSlug }, { slug: examIdOrSlug }] },
      select: { id: true },
    });
    if (!exam) throw new NotFoundException('Exam not found.');
    const existing = await this.prisma.examAttempt.findFirst({ where: { userId, examId: exam.id }, select: { id: true } });
    if (existing) {
      throw new BadRequestException('এই exam আপনি আগে দিয়েছেন। আবার দিতে re-exam request পাঠান।');
    }
    return this.prisma.examAttempt.create({
      data: {
        userId,
        examId: exam.id,
        topicId: dto.topicId ?? null,
        score: dto.score,
        maxMarks: dto.maxMarks,
        correct: dto.correct,
        wrong: dto.wrong,
        unanswered: dto.unanswered,
        passed: dto.passed,
        answers: (dto.answers ?? {}) as object,
      },
    });
  }

  private async resolveExam(idOrSlug: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, title: true, slug: true },
    });
    if (!exam) throw new NotFoundException('Exam not found.');
    return exam;
  }

  /** The signed-in user's attempt (if any) + any pending re-exam request. */
  async myAttempt(examIdOrSlug: string, userId: string) {
    const exam = await this.resolveExam(examIdOrSlug);
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { userId, examId: exam.id },
      orderBy: { submittedAt: 'desc' },
    });
    const pending = await this.prisma.reExamRequest.findFirst({
      where: { userId, examId: exam.id, status: 'PENDING' },
    });
    return { examId: exam.id, attempted: Boolean(attempt), attempt, reExamPending: Boolean(pending) };
  }

  private async examDurationSeconds(examId: string): Promise<number> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { subjects: { include: { topics: true } } },
    });
    if (!exam) return 0;
    const topicMinutes = exam.subjects.reduce(
      (n, s) => n + s.topics.reduce((m, t) => m + (t.durationMinutes || 0), 0),
      0,
    );
    const minutes = topicMinutes > 0 ? topicMinutes : exam.durationMinutes || 0;
    return minutes * 60;
  }

  /** Start (or resume) an exam session; the countdown persists across reloads. */
  async startExam(examIdOrSlug: string, userId: string) {
    const exam = await this.resolveExam(examIdOrSlug);
    const duration = await this.examDurationSeconds(exam.id);
    const now = Date.now();
    let start = await this.prisma.examStart.findUnique({
      where: { userId_examId: { userId, examId: exam.id } },
    });
    if (!start) {
      start = await this.prisma.examStart.create({
        data: { userId, examId: exam.id, startedAt: new Date(now), expiresAt: new Date(now + duration * 1000) },
      });
    }
    const timed = duration > 0;
    const remainingSeconds = timed ? Math.max(0, Math.floor((start.expiresAt.getTime() - now) / 1000)) : 0;
    return { timed, startedAt: start.startedAt, expiresAt: start.expiresAt, remainingSeconds, durationSeconds: duration };
  }

  /** Student asks for a retake; admin must approve. */
  async requestReExam(examIdOrSlug: string, userId: string, note?: string) {
    const exam = await this.resolveExam(examIdOrSlug);
    const attempt = await this.prisma.examAttempt.findFirst({ where: { userId, examId: exam.id }, select: { id: true } });
    if (!attempt) throw new BadRequestException('আপনি এখনো এই exam দেননি।');
    const existing = await this.prisma.reExamRequest.findFirst({
      where: { userId, examId: exam.id, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existing) return existing;
    return this.prisma.reExamRequest.create({ data: { userId, examId: exam.id, note: note?.trim() || null } });
  }

  /** Admin: re-exam requests with user + exam labels. */
  async listReExamRequests(status = 'PENDING') {
    const where = status && status !== 'ALL' ? { status } : {};
    const rows = await this.prisma.reExamRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    const userIds = [...new Set(rows.map((r) => r.userId))];
    const examIds = [...new Set(rows.map((r) => r.examId))];
    const [users, exams] = await Promise.all([
      userIds.length ? this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, phone: true } }) : [],
      examIds.length ? this.prisma.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, title: true, slug: true } }) : [],
    ]);
    const uMap = new Map(users.map((u) => [u.id, u]));
    const eMap = new Map(exams.map((e) => [e.id, e]));
    return rows.map((r) => ({ ...r, user: uMap.get(r.userId) ?? null, exam: eMap.get(r.examId) ?? null }));
  }

  /** Admin: approve (resets attempts) or reject a re-exam request. */
  async decideReExam(id: string, approve: boolean) {
    const req = await this.prisma.reExamRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Request not found.');
    if (approve) {
      await this.prisma.examAttempt.deleteMany({ where: { userId: req.userId, examId: req.examId } });
      await this.prisma.examStart.deleteMany({ where: { userId: req.userId, examId: req.examId } });
    }
    return this.prisma.reExamRequest.update({
      where: { id },
      data: { status: approve ? 'APPROVED' : 'REJECTED', decidedAt: new Date() },
    });
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
