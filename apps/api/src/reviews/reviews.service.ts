import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AdminCreateReviewDto,
  AdminUpdateReviewDto,
  CreateReviewDto,
  UpdateReviewDto,
} from './dto/create-review.dto.js';

const USER_SELECT = { select: { name: true, nameBn: true } } as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Public / user ─────────────────────────────────────────────────────────
  list(productType: string, productId: string) {
    return this.prisma.review.findMany({
      where: { productType, productId, status: 'APPROVED' },
      include: { user: USER_SELECT },
      orderBy: { createdAt: 'desc' },
    });
  }

  mine(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Any signed-in user may review a product — no purchase required. */
  async create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.upsert({
      where: {
        userId_productType_productId: {
          userId,
          productType: dto.productType,
          productId: dto.productId,
        },
      },
      create: {
        userId,
        productType: dto.productType,
        productId: dto.productId,
        rating: dto.rating,
        text: dto.text.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        status: 'APPROVED',
      },
      update: {
        rating: dto.rating,
        text: dto.text.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        status: 'APPROVED',
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found.');
    if (review.userId !== userId) throw new ForbiddenException('You can only edit your own review.');
    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating ?? undefined,
        text: dto.text !== undefined ? dto.text.trim() : undefined,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl?.trim() || null : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found.');
    if (review.userId !== userId) throw new ForbiddenException('You can only delete your own review.');
    await this.prisma.review.delete({ where: { id } });
    return { deleted: id };
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  async listAll(status = 'PENDING', page = 1, perPage = 20) {
    const where = status && status !== 'ALL' ? { status } : {};
    const [total, items] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: { user: { select: { name: true, nameBn: true, phone: true } } },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page, perPage, items };
  }

  async adminCreate(dto: AdminCreateReviewDto) {
    return this.prisma.review.create({
      data: {
        userId: null,
        authorName: dto.authorName?.trim() || 'Shohoz Skill Learner',
        productType: dto.productType,
        productId: dto.productId,
        rating: dto.rating,
        text: dto.text.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        status: dto.status ?? 'APPROVED',
      },
    });
  }

  async adminUpdate(id: string, dto: AdminUpdateReviewDto) {
    const exists = await this.prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Review not found.');
    return this.prisma.review.update({
      where: { id },
      data: {
        authorName: dto.authorName !== undefined ? dto.authorName?.trim() || null : undefined,
        rating: dto.rating ?? undefined,
        text: dto.text !== undefined ? dto.text.trim() : undefined,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl?.trim() || null : undefined,
        status: dto.status ?? undefined,
        productType: dto.productType ?? undefined,
        productId: dto.productId ?? undefined,
      },
    });
  }

  async adminRemove(id: string) {
    const exists = await this.prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Review not found.');
    await this.prisma.review.delete({ where: { id } });
    return { deleted: id };
  }

  async approve(id: string) {
    return this.prisma.review.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async reject(id: string) {
    return this.prisma.review.update({ where: { id }, data: { status: 'REJECTED' } });
  }
}
