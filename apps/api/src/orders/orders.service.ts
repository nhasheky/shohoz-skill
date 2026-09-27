import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Create an order and "hand off" to the gateway (mock init — real: bKash/Nagad/SSLCommerz create-payment call). */
  async create(userId: string, dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        userId,
        productType: dto.productType,
        productId: dto.productId,
        productTitle: `Product ${dto.productId}`,
        amount: dto.amount,
        method: dto.method,
        status: 'PENDING',
        txId: 'TMP-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      },
    });

    // Mock gateway redirect payload. Replace with the gateway's create-payment call.
    const gatewayUrl =
      dto.method === 'BKASH'
        ? this.config.get('BKASH_SANDBOX_URL')
        : this.config.get('SSLCOMMERZ_SANDBOX_URL') ?? 'https://sandbox.example.com';

    return {
      orderId: order.id,
      paymentUrl: `${gatewayUrl}/checkout/${order.txId}`,
      // Frontend then polls GET /orders/:id/poll with ?tx=...
    };
  }

  /** Poll the gateway. Simulates a confirm-query: PENDING → PAID on the 4th poll. */
  async poll(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found.');

    // ── Mock decision logic ────────────────────────────────────────────────
    // Real: query the gateway (bkash /execute-payment, ssl val-veri, nagad verify).
    // We simulate success after a few seconds of polling.
    if (order.status === 'PENDING') {
      const attempts = (order.txId ?? '').split('-')[1] ?? '';
      const tick = Number(attempts.length) || 0;
      if (tick >= 2) {
        await this.prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
        await this.prisma.enrollment.upsert({
          where: { userId_productType_productId: { userId, productType: order.productType, productId: order.productId } },
          create: { userId, productType: order.productType, productId: order.productId, accessFrom: new Date() },
          update: {},
        });
        return { status: 'PAID', message: 'Payment confirmed — access unlocked.' };
      }
      return { status: 'PENDING', message: 'Still waiting for gateway confirmation.' };
    }

    return { status: order.status, message: 'Order status.' };
  }

  async mine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async refund(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== 'PAID') throw new BadRequestException('Only paid orders can be refunded.');
    await this.prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED', refundedAt: new Date() } });
    return { refunded: order.id };
  }

  /** Admin: paginated order listing. */
  async findAll(page = 1, perPage = 20, status?: string) {
    const where = status ? { status } : {};
    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { user: { select: { name: true, phone: true, email: true } } },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page, perPage, items };
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, phone: true, email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  /** Admin: force an order status (e.g. mark PAID after manual confirmation). */
  async setStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    if (dto.status === 'PAID' && order.status !== 'PAID') {
      // Auto-grant access when an order is marked paid.
      await this.prisma.enrollment.upsert({
        where: {
          userId_productType_productId: { userId: order.userId, productType: order.productType, productId: order.productId },
        },
        create: {
          userId: order.userId,
          productType: order.productType,
          productId: order.productId,
          accessFrom: new Date(),
        },
        update: {},
      });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        refundedAt: dto.status === 'REFUNDED' ? new Date() : undefined,
      },
    });
  }
}
