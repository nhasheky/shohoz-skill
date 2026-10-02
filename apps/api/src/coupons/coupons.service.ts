import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto.js';

export type PricedItem = { productType: string; unitPrice: number; quantity: number };

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalize(code: string) {
    return String(code ?? '').trim().toUpperCase();
  }

  /**
   * Validate a coupon against the priced items in the cart and return the
   * discount (in BDT). Throws a friendly error when the coupon cannot apply.
   */
  async evaluate(code: string, items: PricedItem[]) {
    const normalized = this.normalize(code);
    if (!normalized) throw new BadRequestException('Enter a coupon code.');

    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });
    if (!coupon || !coupon.active) throw new BadRequestException('Invalid coupon code.');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException('This coupon is not active yet.');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestException('This coupon has expired.');
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit.');
    }

    const appliesTo = coupon.appliesTo ?? [];
    const eligible = items.filter((i) => appliesTo.length === 0 || appliesTo.includes(i.productType));
    if (!eligible.length) throw new BadRequestException('This coupon does not apply to your items.');

    const eligibleSubtotal = eligible.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    if (eligibleSubtotal < coupon.minSubtotal) {
      throw new BadRequestException(`Minimum order of ৳${coupon.minSubtotal} required for this coupon.`);
    }

    let discount = coupon.type === 'FIXED' ? coupon.value : Math.floor((eligibleSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.max(0, Math.min(discount, eligibleSubtotal));

    return { code: coupon.code, discount, description: coupon.description ?? undefined };
  }

  /** Increment a coupon's usage counter after a successful order creation. */
  async markUsed(code: string) {
    const normalized = this.normalize(code);
    if (!normalized) return;
    await this.prisma.coupon
      .update({ where: { code: normalized }, data: { usedCount: { increment: 1 } } })
      .catch(() => null);
  }

  // ─── Admin CRUD ────────────────────────────────────────────────────────────
  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const code = this.normalize(dto.code);
    if (!code) throw new BadRequestException('Coupon code is required.');
    if (dto.type === 'PERCENT' && dto.value > 100) throw new BadRequestException('Percent value cannot exceed 100.');
    const exists = await this.prisma.coupon.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('A coupon with this code already exists.');
    return this.prisma.coupon.create({
      data: {
        code,
        description: dto.description?.trim() || null,
        type: dto.type,
        value: dto.value,
        minSubtotal: dto.minSubtotal ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        appliesTo: dto.appliesTo ?? [],
        active: dto.active ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Coupon not found.');
    const data = this.clean(dto) as Record<string, unknown>;
    if (dto.code) {
      const code = this.normalize(dto.code);
      const clash = await this.prisma.coupon.findUnique({ where: { code } });
      if (clash && clash.id !== id) throw new BadRequestException('A coupon with this code already exists.');
      data.code = code;
    }
    if (data.type === 'PERCENT' && ((data.value as number | undefined) ?? existing.value) > 100) {
      throw new BadRequestException('Percent value cannot exceed 100.');
    }
    return this.prisma.coupon.update({ where: { id }, data: data as Prisma.CouponUncheckedUpdateInput });
  }

  async remove(id: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Coupon not found.');
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: id };
  }

  private clean(dto: CreateCouponDto | UpdateCouponDto): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minSubtotal !== undefined) data.minSubtotal = dto.minSubtotal;
    if (dto.maxDiscount !== undefined) data.maxDiscount = dto.maxDiscount ?? null;
    if (dto.appliesTo !== undefined) data.appliesTo = dto.appliesTo ?? [];
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit ?? null;
    return data;
  }
}
