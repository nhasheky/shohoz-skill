import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  list(productType: string, productId: string) {
    return this.prisma.review.findMany({
      where: { productType, productId, status: 'APPROVED' },
      include: { user: { select: { name: true, nameBn: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: paginated review listing with optional status filter (default PENDING). */
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

  async approve(id: string) {
    return this.prisma.review.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async reject(id: string) {
    return this.prisma.review.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  /** Reviews are created PENDING and moderated by admins. */
  async create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        userId,
        productType: dto.productType,
        productId: dto.productId,
        rating: dto.rating,
        text: dto.text,
        status: 'PENDING',
      },
    });
  }
}
