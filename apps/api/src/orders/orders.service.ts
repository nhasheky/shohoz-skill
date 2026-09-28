import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import type { CheckoutDto } from './dto/checkout.dto.js';

type ResolvedProduct = {
  title: string;
  unitPrice: number;
  isPhysical: boolean;
  variant?: string;
  allowedPaymentMethods: string[];
};

@Injectable()
export class OrdersService {
  /** In-memory poll ticks for the mock gateway (PENDING → PAID after N polls). */
  private readonly pollTicks = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Guest / authenticated checkout ────────────────────────────────────────
  /**
   * Create an order. Prices and delivery charges are resolved server-side from
   * the database — the client cannot dictate the amount. Supports guest users
   * (userId = null) and enforces per-product payment-method rules.
   */
  async checkout(userId: string | null, dto: CheckoutDto) {
    const product = await this.resolveProduct(dto);

    const quantity = dto.quantity ?? 1;
    const amount = product.unitPrice * quantity;

    const settings = await this.prisma.siteSetting.findUnique({ where: { id: 'default' } });
    const chargeDhaka = settings?.deliveryChargeDhaka ?? 60;
    const chargeOutside = settings?.deliveryChargeOutside ?? 120;

    let deliveryCharge = 0;
    if (product.isPhysical) {
      if (!dto.region) throw new BadRequestException('Delivery region is required for physical books.');
      if (!dto.address?.trim()) throw new BadRequestException('Delivery address is required for physical books.');
      deliveryCharge = dto.region === 'DHAKA' ? chargeDhaka : chargeOutside;
    }

    // ── Payment-method resolution ────────────────────────────────────────────
    const codEnabled = settings?.codEnabled ?? true;
    const sslEnabled = settings?.sslcommerzEnabled ?? true;
    const defaults = product.isPhysical ? ['COD', 'SSLCOMMERZ'] : ['SSLCOMMERZ'];
    const configured = product.allowedPaymentMethods.length ? product.allowedPaymentMethods : defaults;
    const allowed = configured.filter((m) =>
      m === 'COD' ? codEnabled && product.isPhysical : m === 'SSLCOMMERZ' ? sslEnabled : false,
    );
    if (!allowed.includes(dto.paymentMethod)) {
      throw new BadRequestException(
        `Payment method ${dto.paymentMethod} is not available for this product.`,
      );
    }

    const total = amount + deliveryCharge;
    const isFree = total === 0;
    const status = isFree ? 'PAID' : 'PENDING';
    const txId = `${isFree ? 'FREE' : dto.paymentMethod}-${randomRef()}`;

    const order = await this.prisma.order.create({
      data: {
        userId: userId ?? null,
        guestName: userId ? null : dto.guestName?.trim() || null,
        guestPhone: userId ? null : normalizePhone(dto.guestPhone) ?? null,
        guestEmail: userId ? null : dto.guestEmail?.toLowerCase().trim() || null,
        productType: dto.productType,
        productId: dto.productId,
        productTitle: product.title,
        variant: product.variant ?? null,
        isPhysical: product.isPhysical,
        quantity,
        amount,
        deliveryCharge,
        total,
        method: dto.paymentMethod,
        paymentMethod: dto.paymentMethod,
        status,
        address: dto.address?.trim() || null,
        region: dto.region ?? null,
        txId,
      },
    });

    // Free digital items grant access immediately for signed-in users.
    if (isFree && userId && !product.isPhysical) {
      await this.grantAccess(userId, dto.productType, dto.productId);
    }

    const paymentUrl =
      !isFree && dto.paymentMethod === 'SSLCOMMERZ'
        ? `${this.config.get('SSLCOMMERZ_SANDBOX_URL') ?? 'https://sandbox.sslcommerz.com'}/checkout/${order.txId}`
        : null;

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amount,
      deliveryCharge,
      total,
      paymentUrl,
      message: product.isPhysical
        ? dto.paymentMethod === 'COD'
          ? 'Order placed. Pay cash on delivery.'
          : 'Redirecting to SSLCOMMERZ…'
        : 'Proceeding to payment…',
    };
  }

  /** Load a product (by id or slug) and compute its authoritative price. */
  private async resolveProduct(dto: CheckoutDto): Promise<ResolvedProduct> {
    if (dto.productType === 'course') {
      const course = await this.prisma.course.findFirst({
        where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
        include: { prices: true },
      });
      if (!course) throw new NotFoundException('Course not found.');
      const price =
        course.prices.find((p) => p.duration === dto.duration) ??
        course.prices.find((p) => p.duration === 'LIFETIME') ??
        course.prices[0];
      return {
        title: course.title,
        unitPrice: price?.amount ?? 0,
        isPhysical: false,
        allowedPaymentMethods: course.allowedPaymentMethods,
      };
    }

    if (dto.productType === 'book') {
      const book = await this.prisma.book.findFirst({
        where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
      });
      if (!book) throw new NotFoundException('Book not found.');
      const variant = dto.variant ?? (book.hardcopyPrice ? 'hardcopy' : 'pdf');
      const isPhysical = variant === 'hardcopy';
      const unitPrice = isPhysical ? book.hardcopyPrice ?? book.pdfPrice : book.pdfPrice;
      return {
        title: isPhysical ? `${book.title} (Hardcopy)` : `${book.title} (PDF)`,
        unitPrice,
        isPhysical,
        variant,
        allowedPaymentMethods: book.allowedPaymentMethods,
      };
    }

    const exam = await this.prisma.exam.findFirst({
      where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
    });
    if (!exam) throw new NotFoundException('Exam not found.');
    return {
      title: exam.title,
      unitPrice: exam.isFree ? 0 : exam.priceAmount,
      isPhysical: false,
      allowedPaymentMethods: exam.allowedPaymentMethods,
    };
  }

  // ─── Legacy create (kept for backward compatibility) ────────────────────────
  async create(userId: string, dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        userId,
        productType: dto.productType,
        productId: dto.productId,
        productTitle: `Product ${dto.productId}`,
        amount: dto.amount,
        total: dto.amount,
        method: dto.method,
        paymentMethod: 'SSLCOMMERZ',
        status: 'PENDING',
        txId: 'TMP-' + randomRef(),
      },
    });

    const gatewayUrl =
      dto.method === 'BKASH'
        ? this.config.get('BKASH_SANDBOX_URL')
        : this.config.get('SSLCOMMERZ_SANDBOX_URL') ?? 'https://sandbox.example.com';

    return {
      orderId: order.id,
      paymentUrl: `${gatewayUrl}/checkout/${order.txId}`,
    };
  }

  // ─── Mock gateway polling ───────────────────────────────────────────────────
  /** Poll the gateway. COD orders never auto-settle. PENDING → PAID after 2 polls. */
  async poll(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.status !== 'PENDING') {
      return { status: order.status, message: 'Order status.' };
    }

    if (order.paymentMethod === 'COD') {
      return { status: 'PENDING', message: 'Cash on delivery — payment collected at delivery.' };
    }

    const ticks = (this.pollTicks.get(orderId) ?? 0) + 1;
    this.pollTicks.set(orderId, ticks);

    if (ticks >= 2) {
      await this.prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      if (order.userId && !order.isPhysical) {
        await this.grantAccess(order.userId, order.productType, order.productId);
      }
      return { status: 'PAID', message: 'Payment confirmed — access unlocked.' };
    }
    return { status: 'PENDING', message: 'Still waiting for gateway confirmation.' };
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

  /** Admin: paginated order listing with customer + product relations. */
  async findAll(page = 1, perPage = 20, status?: string) {
    const where = status ? { status } : {};
    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { user: { select: { id: true, name: true, nameBn: true, phone: true, email: true } } },
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
      include: { user: { select: { id: true, name: true, phone: true, email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  /** Admin: force an order status (e.g. mark PAID after manual confirmation). */
  async setStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    if (dto.status === 'PAID' && order.status !== 'PAID' && order.userId && !order.isPhysical) {
      await this.grantAccess(order.userId, order.productType, order.productId);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        refundedAt: dto.status === 'REFUNDED' ? new Date() : undefined,
      },
    });
  }

  private async grantAccess(userId: string, productType: string, productId: string) {
    await this.prisma.enrollment.upsert({
      where: { userId_productType_productId: { userId, productType, productId } },
      create: { userId, productType, productId, accessFrom: new Date() },
      update: {},
    });
  }
}

function randomRef() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) return '+88' + digits;
  if (digits.length === 13 && digits.startsWith('8801')) return '+88' + digits.slice(2);
  return phone;
}
