import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateExamDto } from './dto/create-exam.dto.js';
import type { UpdateExamDto } from './dto/update-exam.dto.js';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.exam.findMany({
      where: { published: true },
      include: { subjects: { include: { topics: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { slug },
      include: {
        subjects: { include: { topics: { include: { questions: true } } } },
      },
    });
    if (!exam || !exam.published) throw new NotFoundException('Exam not found.');
    return exam;
  }

  async create(dto: CreateExamDto) {
    const { subjects, ...scalars } = dto;
    return this.prisma.exam.create({
      data: {
        ...scalars,
        ...(subjects?.length
          ? {
              subjects: {
                create: subjects.map((s, i) => ({
                  title: s.title,
                  sortOrder: s.sortOrder ?? i,
                  topics: s.topics?.length
                    ? {
                        create: s.topics.map((t, j) => ({
                          title: t.title,
                          slug: t.slug,
                          questionsCount: t.questionsCount,
                          durationMinutes: t.durationMinutes,
                          marksPerQuestion: t.marksPerQuestion,
                          negativeMarks: t.negativeMarks,
                          sortOrder: t.sortOrder ?? j,
                          questions: t.questions?.length
                            ? { create: t.questions.map((q, k) => ({ ...q, sortOrder: q.sortOrder ?? k })) }
                            : undefined,
                        })),
                      }
                    : undefined,
                })),
              },
            }
          : {}),
      },
      include: { subjects: { include: { topics: { include: { questions: true } } } } },
    });
  }

  async update(id: string, dto: UpdateExamDto) {
    await this.ensureExists(id);
    const { subjects, ...scalars } = dto;
    return this.prisma.exam.update({
      where: { id },
      data: {
        ...scalars,
        ...(subjects
          ? {
              subjects: {
                deleteMany: {},
                create: subjects.map((s, i) => ({
                  title: s.title,
                  sortOrder: s.sortOrder ?? i,
                  topics: s.topics?.length
                    ? {
                        create: s.topics.map((t, j) => ({
                          title: t.title,
                          slug: t.slug,
                          questionsCount: t.questionsCount,
                          durationMinutes: t.durationMinutes,
                          marksPerQuestion: t.marksPerQuestion,
                          negativeMarks: t.negativeMarks,
                          sortOrder: t.sortOrder ?? j,
                          questions: t.questions?.length
                            ? { create: t.questions.map((q, k) => ({ ...q, sortOrder: q.sortOrder ?? k })) }
                            : undefined,
                        })),
                      }
                    : undefined,
                })),
              },
            }
          : {}),
      },
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
}
