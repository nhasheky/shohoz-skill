import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMarketingPixelDto, UpdateMarketingPixelDto } from './dto/marketing.dto.js';

/** Admin-managed marketing pixels injected into the storefront. */
@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: only the enabled pixels, oldest first (stable injection order). */
  async listEnabled() {
    return this.prisma.marketingPixel.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Admin: every pixel regardless of state. */
  async listAll() {
    return this.prisma.marketingPixel.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateMarketingPixelDto) {
    return this.prisma.marketingPixel.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateMarketingPixelDto) {
    const exists = await this.prisma.marketingPixel.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Pixel not found.');
    return this.prisma.marketingPixel.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    const exists = await this.prisma.marketingPixel.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Pixel not found.');
    await this.prisma.marketingPixel.delete({ where: { id } });
    return { deleted: id };
  }
}
