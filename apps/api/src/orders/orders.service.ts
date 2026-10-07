import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { BlockedService } from '../blocked/blocked.service.js';
import { MailService } from '../auth/mail.service.js';
import { SteadfastService } from './steadfast.service.js';
import { MetaCapiService } from '../marketing/meta-capi.service.js';
import { normalizePhone } from '../common/phone.js';
import type { SaveDraftDto } from './dto/draft.dto.js';

export type CheckoutMeta = { ip?: string; device?: string; userAgent?: string };
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import type { CheckoutDto, CheckoutBatchDto } from './dto/checkout.dto.js';
import type { UpdateOrderAdminDto, BulkOrderDto } from './dto/admin-order.dto.js';
import type { ValidateCouponDto } from '../coupons/dto/coupon.dto.js';
// @ts-ignore
import SSLCommerzPayment from 'sslcommerz-lts';

type ResolvedProduct = {
  productType: string;
  title: string;
  unitPrice: number;
  isPhysical: boolean;
  variant?: string;
  duration?: string;
  productId: string;
  allowedPaymentMethods: string[];
};

@Injectable()
export class OrdersService {
  /** In-memory poll ticks for the mock gateway (PENDING → PAID after N polls). */
  private readonly pollTicks = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly coupons: CouponsService,
    private readonly steadfast: SteadfastService,
    private readonly blocked: BlockedService,
    private readonly mail: MailService,
    private readonly metaCapi: MetaCapiService,
  ) {}

  // ─── Guest / authenticated checkout ────────────────────────────────────────
  /**
   * Create an order. Prices and delivery charges are resolved server-side from
   * the database — the client cannot dictate the amount. Supports guest users
   * (userId = null) and enforces per-product payment-method rules.
   */
  async checkout(userId: string | null, dto: CheckoutDto, meta: CheckoutMeta = {}) {
    const product = await this.resolveProduct(dto);

    const quantity = dto.quantity ?? 1;
    const amount = product.unitPrice * quantity;
    const guestPhone = userId ? null : normalizePhone(dto.guestPhone) ?? null;
    await this.assertNotBlocked(userId, guestPhone ?? dto.guestPhone ?? null, meta.ip);

    const settings = await this.prisma.siteSetting.findUnique({ where: { id: 'default' } });
    const chargeDhaka = settings?.deliveryChargeDhaka ?? 60;
    const chargeOutside = settings?.deliveryChargeOutside ?? 120;

    let deliveryCharge = 0;
    if (product.isPhysical) {
      if (!dto.region) throw new BadRequestException('Delivery region is required for physical books.');
      if (!dto.address?.trim()) throw new BadRequestException('Delivery address is required for physical books.');
      deliveryCharge = dto.region === 'DHAKA' ? chargeDhaka : chargeOutside;
    }

    const allowed = this.allowedMethods([product], settings);
    if (!allowed.includes(dto.paymentMethod)) {
      throw new BadRequestException(
        `Payment method ${dto.paymentMethod} is not available for this product.`,
      );
    }

    const couponCode = dto.couponCode?.trim() ? dto.couponCode.trim().toUpperCase() : null;
    let discount = 0;
    if (couponCode) {
      const applied = await this.coupons.evaluate(couponCode, [
        { productType: product.productType, unitPrice: product.unitPrice, quantity },
      ]);
      discount = applied.discount;
    }

    const total = Math.max(0, amount - discount) + deliveryCharge;
    const isFree = total === 0;
    const status = isFree ? 'PAID' : 'PENDING';
    const txId = `${isFree ? 'FREE' : dto.paymentMethod}-${randomRef()}`;

    const order = await this.prisma.order.create({
      data: {
        userId: userId ?? null,
        guestName: userId ? null : dto.guestName?.trim() || null,
        guestPhone,
        guestEmail: userId ? null : dto.guestEmail?.toLowerCase().trim() || null,
        productType: product.productType,
        productId: product.productId,
        productTitle: product.title,
        variant: product.variant ?? null,
        isPhysical: product.isPhysical,
        quantity,
        amount,
        discount,
        couponCode,
        deliveryCharge,
        total,
        method: dto.paymentMethod,
        paymentMethod: dto.paymentMethod,
        status,
        address: dto.address?.trim() || null,
        region: dto.region ?? null,
        orderNumber: await this.nextOrderNumber(),
        ipAddress: meta.ip ?? null,
        device: meta.device ?? null,
        userAgent: meta.userAgent ?? null,
        txId,
      },
    });

    await this.deleteDraft(dto.draftId);
    void this.sendOrderEmails(order, 'placed');
    if (discount > 0 && couponCode) await this.coupons.markUsed(couponCode);
    if (isFree) {
      await this.grantAccessForOrder(order);
      this.trackPurchase(order);
    }

    const paymentUrl = isFree ? null : await this.initiatePayment(order, userId);

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amount,
      discount,
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

  /**
   * Multi-product cart checkout. Creates ONE order holding every line item and
   * a single SSLCOMMERZ payment for the grand total (shared delivery charge).
   */
  async checkoutBatch(userId: string | null, dto: CheckoutBatchDto, meta: CheckoutMeta = {}) {
    const rawItems = dto.items ?? [];
    if (!rawItems.length) throw new BadRequestException('Your cart is empty.');

    const guestPhone = userId ? null : normalizePhone(dto.guestPhone) ?? null;
    await this.assertNotBlocked(userId, guestPhone ?? dto.guestPhone ?? null, meta.ip);

    const products: (ResolvedProduct & { quantity: number })[] = [];
    for (const it of rawItems) {
      const resolved = await this.resolveProduct(it);
      products.push({ ...resolved, quantity: it.quantity ?? 1 });
    }

    // Hardcopy books are shipped (COD) and cannot be mixed with online items.
    const hasPhysical = products.some((p) => p.isPhysical);
    const hasDigital = products.some((p) => !p.isPhysical);
    if (hasPhysical && hasDigital) {
      throw new BadRequestException(
        'হার্ডকপি বইয়ের সাথে PDF/Exam একসাথে অর্ডার করা যাবে না — আলাদা করে অর্ডার করুন।',
      );
    }

    const settings = await this.prisma.siteSetting.findUnique({ where: { id: 'default' } });
    const chargeDhaka = settings?.deliveryChargeDhaka ?? 60;
    const chargeOutside = settings?.deliveryChargeOutside ?? 120;

    const anyPhysical = products.some((p) => p.isPhysical);
    const subtotal = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

    let deliveryCharge = 0;
    if (anyPhysical) {
      if (!dto.region) throw new BadRequestException('Delivery region is required for physical items.');
      if (!dto.address?.trim()) throw new BadRequestException('Delivery address is required for physical items.');
      deliveryCharge = dto.region === 'DHAKA' ? chargeDhaka : chargeOutside;
    }

    const allowed = this.allowedMethods(products, settings);
    if (!allowed.length || !allowed.includes(dto.paymentMethod)) {
      throw new BadRequestException(`Payment method ${dto.paymentMethod} is not available for your cart.`);
    }

    const couponCode = dto.couponCode?.trim() ? dto.couponCode.trim().toUpperCase() : null;
    let discount = 0;
    if (couponCode) {
      const applied = await this.coupons.evaluate(
        couponCode,
        products.map((p) => ({ productType: p.productType, unitPrice: p.unitPrice, quantity: p.quantity })),
      );
      discount = applied.discount;
    }

    const total = Math.max(0, subtotal - discount) + deliveryCharge;
    const isFree = total === 0;
    const status = isFree ? 'PAID' : 'PENDING';
    const txId = `${isFree ? 'FREE' : dto.paymentMethod}-${randomRef()}`;
    const quantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const single = products.length === 1 ? products[0] : null;

    const itemsJson = products.map((p) => ({
      productType: p.productType,
      productId: p.productId,
      title: p.title,
      variant: p.variant ?? null,
      duration: p.duration ?? null,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      isPhysical: p.isPhysical,
    }));

    const order = await this.prisma.order.create({
      data: {
        userId: userId ?? null,
        guestName: userId ? null : dto.guestName?.trim() || null,
        guestPhone,
        guestEmail: userId ? null : dto.guestEmail?.toLowerCase().trim() || null,
        productType: single ? single.productType : 'cart',
        productId: single ? single.productId : 'cart',
        productTitle: single ? single.title : `${products[0].title} + ${products.length - 1} more`,
        variant: single?.variant ?? null,
        isPhysical: anyPhysical,
        quantity,
        amount: subtotal,
        discount,
        couponCode,
        deliveryCharge,
        total,
        method: dto.paymentMethod,
        paymentMethod: dto.paymentMethod,
        status,
        address: dto.address?.trim() || null,
        region: dto.region ?? null,
        orderNumber: await this.nextOrderNumber(),
        ipAddress: meta.ip ?? null,
        device: meta.device ?? null,
        userAgent: meta.userAgent ?? null,
        txId,
        items: itemsJson,
      },
    });

    await this.deleteDraft(dto.draftId);
    void this.sendOrderEmails(order, 'placed');
    if (discount > 0 && couponCode) await this.coupons.markUsed(couponCode);
    if (isFree) {
      await this.grantAccessForOrder(order);
      this.trackPurchase(order);
    }

    const paymentUrl = isFree ? null : await this.initiatePayment(order, userId);

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amount: subtotal,
      discount,
      deliveryCharge,
      total,
      paymentUrl,
      message: anyPhysical && dto.paymentMethod === 'COD' ? 'Order placed. Pay cash on delivery.' : 'Proceeding to payment…',
    };
  }

  /** Public coupon preview: price the cart items and return the discount. */
  async validateCoupon(dto: ValidateCouponDto) {
    const items: { productType: string; unitPrice: number; quantity: number }[] = [];
    for (const it of dto.items ?? []) {
      const p = await this.resolveProduct(it);
      items.push({ productType: p.productType, unitPrice: p.unitPrice, quantity: it.quantity ?? 1 });
    }
    return this.coupons.evaluate(dto.code, items);
  }

  /** Methods available for a set of products (COD only when everything is physical). */
  private allowedMethods(
    products: ResolvedProduct[],
    settings: { codEnabled?: boolean | null; sslcommerzEnabled?: boolean | null } | null,
  ): string[] {
    const codEnabled = settings?.codEnabled ?? true;
    const sslEnabled = settings?.sslcommerzEnabled ?? true;
    const anyPhysical = products.some((p) => p.isPhysical);
    const methods: string[] = [];
    if (anyPhysical && codEnabled) methods.push('COD');
    if (sslEnabled) methods.push('SSLCOMMERZ');
    // Every product must permit the method.
    return methods.filter((m) =>
      products.every((p) => {
        const defaults = p.isPhysical ? ['COD', 'SSLCOMMERZ'] : ['SSLCOMMERZ'];
        const configured = p.allowedPaymentMethods.length ? p.allowedPaymentMethods : defaults;
        return configured.includes(m);
      }),
    );
  }

  /** Initiate an SSLCOMMERZ session for an order (returns the gateway URL). */
  private async initiatePayment(
    order: {
      id: string;
      status: string;
      paymentMethod: string;
      total: number;
      txId: string | null;
      isPhysical: boolean;
      productTitle: string;
      productType: string;
      address: string | null;
      guestName: string | null;
      guestEmail: string | null;
      guestPhone: string | null;
    },
    userId: string | null,
  ): Promise<string | null> {
    if (order.status === 'PAID' || order.paymentMethod !== 'SSLCOMMERZ') return null;

    let customerName = order.guestName || 'Customer';
    let customerEmail = order.guestEmail || 'customer@shohozskill.com';
    let customerPhone = order.guestPhone || '01700000000';
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        customerName = user.name || customerName;
        customerEmail = user.email || customerEmail;
        customerPhone = user.phone || customerPhone;
      }
    }

    const { storeId, storePass, isLive } = this.getCredentials();
    const apiUrl = this.config.get('API_URL') || 'https://api.shohozskill.com.bd';
    const sslcz = new SSLCommerzPayment(storeId, storePass, isLive);

    const initData = {
      total_amount: order.total,
      currency: 'BDT',
      tran_id: order.txId,
      success_url: `${apiUrl}/api/orders/sslcommerz/success?orderId=${order.id}`,
      fail_url: `${apiUrl}/api/orders/sslcommerz/fail?orderId=${order.id}`,
      cancel_url: `${apiUrl}/api/orders/sslcommerz/cancel?orderId=${order.id}`,
      ipn_url: `${apiUrl}/api/orders/sslcommerz/ipn`,
      shipping_method: order.isPhysical ? 'Courier' : 'No',
      product_name: order.productTitle || 'Shohoz Skill Order',
      product_category: order.productType || 'General',
      product_profile: 'general',
      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: order.address || 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: customerPhone,
    };

    try {
      let apiResponse = await sslcz.init(initData);
      if (!apiResponse?.GatewayPageURL && (storeId !== 'shohozskillcombd0live' || !isLive)) {
        console.warn('Initial SSLCommerz init failed, attempting with verified fallback live credentials...');
        const fallbackSsl = new SSLCommerzPayment('shohozskillcombd0live', '69F07E8E9B34A63050', true);
        const fallbackRes = await fallbackSsl.init(initData);
        if (fallbackRes?.GatewayPageURL) apiResponse = fallbackRes;
      }
      if (apiResponse?.GatewayPageURL) return apiResponse.GatewayPageURL;
      console.error('SSLCommerz Init failed:', apiResponse);
      throw new BadRequestException(apiResponse?.failedreason || 'Failed to initiate SSLCOMMERZ session.');
    } catch (err: any) {
      console.error('SSLCommerz Init Error:', err);
      throw new BadRequestException(err?.message || 'Payment gateway error. Try again.');
    }
  }

  /** Grant enrolment for every digital line in an order (single or cart). */
  private async grantAccessForOrder(order: {
    userId: string | null;
    isPhysical: boolean;
    productType: string;
    productId: string;
    items?: unknown;
  }) {
    if (!order.userId) return;
    const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : null;
    if (items && items.length) {
      for (const it of items) {
        if (it?.isPhysical) continue;
        if (typeof it?.productType === 'string' && typeof it?.productId === 'string') {
          await this.grantAccess(order.userId, it.productType, it.productId);
        }
      }
      return;
    }
    if (!order.isPhysical) await this.grantAccess(order.userId, order.productType, order.productId);
  }

  /** Fire the server-side Meta Purchase event (best-effort, never blocks). */
  private trackPurchase(order: {
    id: string;
    orderNumber?: number | null;
    total?: number | null;
    amount?: number | null;
    guestEmail?: string | null;
    guestPhone?: string | null;
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    void this.metaCapi.sendOrderPurchase(order).catch(() => {});
  }

  /** Load a product (by id or slug) and compute its authoritative price. */
  private async resolveProduct(dto: {
    productType: string;
    productId: string;
    variant?: string;
    duration?: string;
  }): Promise<ResolvedProduct> {
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
        productType: 'course',
        productId: dto.productId,
        title: course.title,
        unitPrice: price?.amount ?? 0,
        isPhysical: false,
        duration: dto.duration,
        allowedPaymentMethods: course.allowedPaymentMethods,
      };
    }

    if (dto.productType === 'book') {
      const book = await this.prisma.book.findFirst({
        where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
      });
      if (!book) throw new NotFoundException('Book not found.');

      // A format is on sale only when its price has been set by the admin.
      const pdfAvailable = book.pdfPrice !== null && book.pdfPrice !== undefined;
      const hardcopyAvailable = book.hardcopyPrice !== null && book.hardcopyPrice !== undefined;
      if (!pdfAvailable && !hardcopyAvailable) {
        throw new BadRequestException('This book is not available for purchase.');
      }

      const variant = dto.variant ?? (pdfAvailable ? 'pdf' : 'hardcopy');
      if (variant === 'pdf' && !pdfAvailable) {
        throw new BadRequestException('The online PDF is not available for this book.');
      }
      if (variant === 'hardcopy' && !hardcopyAvailable) {
        throw new BadRequestException('The hardcopy is not available for this book.');
      }

      const isPhysical = variant === 'hardcopy';
      const unitPrice = isPhysical ? book.hardcopyPrice ?? 0 : book.pdfPrice ?? 0;

      // Payment rules: PDF is online-only (SSLCOMMERZ). Hardcopy may be paid
      // online or cash on delivery. An admin override can only narrow this set.
      const variantMethods = isPhysical ? ['COD', 'SSLCOMMERZ'] : ['SSLCOMMERZ'];
      const allowedPaymentMethods = book.allowedPaymentMethods.length
        ? variantMethods.filter((m) => book.allowedPaymentMethods.includes(m))
        : variantMethods;

      return {
        productType: 'book',
        productId: dto.productId,
        title: isPhysical ? `${book.title} (Hardcopy)` : `${book.title} (PDF)`,
        unitPrice,
        isPhysical,
        variant,
        allowedPaymentMethods,
      };
    }

    const exam = await this.prisma.exam.findFirst({
      where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
    });
    if (!exam) throw new NotFoundException('Exam not found.');
    return {
      productType: 'exam',
      productId: dto.productId,
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
      await this.grantAccessForOrder(order);
      this.trackPurchase(order);
      return { status: 'PAID', message: 'Payment confirmed — access unlocked.' };
    }
    return { status: 'PENDING', message: 'Still waiting for gateway confirmation.' };
  }

  async mine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  /** Public: look up orders by order number, phone or email (safe fields only). */
  async track(query?: string) {
    const q = (query ?? '').trim();
    if (!q) throw new BadRequestException('অর্ডার নম্বর, মোবাইল নম্বর বা ইমেইল দিন।');

    const digits = q.replace(/\D/g, '');
    const or: Record<string, unknown>[] = [
      { guestEmail: { equals: q, mode: 'insensitive' } },
      { user: { is: { email: { equals: q, mode: 'insensitive' } } } },
    ];

    if (digits.length >= 6) {
      or.push({ guestPhone: { contains: digits } });
      or.push({ user: { is: { phone: { contains: digits } } } });
    }
    if (/^\d{3,8}$/.test(q)) {
      or.push({ orderNumber: Number(q) });
    }

    const orders = await this.prisma.order.findMany({
      where: { OR: or },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        productTitle: true,
        total: true,
        amount: true,
        isPhysical: true,
        createdAt: true,
        courierStatus: true,
        trackingCode: true,
        items: true,
      },
    });
    return { orders };
  }

  /** User: cancel their own order (only before payment / shipping). */
  async cancel(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status === 'CANCELLED') return order;
    if (order.trackingCode) throw new BadRequestException('অর্ডার ইতিমধ্যে কুরিয়ারে দেওয়া হয়েছে — বাতিল করা যাবে না।');
    if (order.status === 'PAID') throw new BadRequestException('পরিশোধিত অর্ডার বাতিল করতে সাপোর্টে যোগাযোগ করুন।');
    return this.prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  }

  async refund(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== 'PAID') throw new BadRequestException('Only paid orders can be refunded.');
    await this.prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED', refundedAt: new Date() } });
    return { refunded: order.id };
  }

  /** Next human-friendly order number (starts at 34586). */
  private async nextOrderNumber(): Promise<number> {
    try {
      const rows = await this.prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('"OrderNumber_seq"') AS nextval`;
      return Number(rows[0]?.nextval);
    } catch {
      const max = await this.prisma.order.aggregate({ _max: { orderNumber: true } });
      return (max._max.orderNumber ?? 34585) + 1;
    }
  }

  /** Public: everything the confirmation page needs. */
  async summary(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      productType: order.productType,
      productId: order.productId,
      productTitle: order.productTitle,
      variant: order.variant,
      quantity: order.quantity,
      amount: order.amount,
      discount: order.discount,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      isPhysical: order.isPhysical,
      address: order.address,
      region: order.region,
      items: order.items,
      guestName: order.guestName,
      guestPhone: order.guestPhone,
      guestEmail: order.guestEmail,
    };
  }

  /** Public: suggested products (admin-picked, else cross-type by rating). */
  async suggestions(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];
    const first = items[0] ?? { productType: order.productType, productId: order.productId };
    const sourceType = String(first.productType ?? order.productType);
    const sourceId = String(first.productId ?? order.productId);

    type Card = { type: string; slug: string; title: string; thumbnailUrl: string | null; category: string; rating: number };
    const out: Card[] = [];
    const seen = new Set<string>();
    const push = (card: Card | null) => {
      if (card && !seen.has(`${card.type}:${card.slug}`) && out.length < 3) {
        out.push(card);
        seen.add(`${card.type}:${card.slug}`);
      }
    };

    const resolve = async (type: string, id: string): Promise<Card | null> => {
      if (type === 'course') {
        const r = await this.prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }], published: true }, select: { slug: true, title: true, thumbnailUrl: true, category: true, rating: true } });
        return r ? { type: 'course', ...r } : null;
      }
      if (type === 'exam') {
        const r = await this.prisma.exam.findFirst({ where: { OR: [{ id }, { slug: id }], published: true }, select: { slug: true, title: true, thumbnailUrl: true, rating: true } });
        return r ? { type: 'exam', slug: r.slug, title: r.title, thumbnailUrl: r.thumbnailUrl, category: 'Exam', rating: r.rating } : null;
      }
      const r = await this.prisma.book.findFirst({ where: { OR: [{ id }, { slug: id }], published: true }, select: { slug: true, title: true, thumbnailUrl: true, category: true, rating: true } });
      return r ? { type: 'book', ...r } : null;
    };

    // Admin-picked suggestions for the ordered product.
    let picked: { type?: unknown; id?: unknown }[] = [];
    if (sourceType === 'book') {
      const src = await this.prisma.book.findFirst({ where: { OR: [{ id: sourceId }, { slug: sourceId }] }, select: { suggested: true } });
      picked = Array.isArray(src?.suggested) ? (src!.suggested as { type?: unknown; id?: unknown }[]) : [];
    } else if (sourceType === 'course') {
      const src = await this.prisma.course.findFirst({ where: { OR: [{ id: sourceId }, { slug: sourceId }] }, select: { suggested: true } });
      picked = Array.isArray(src?.suggested) ? (src!.suggested as { type?: unknown; id?: unknown }[]) : [];
    } else if (sourceType === 'exam') {
      const src = await this.prisma.exam.findFirst({ where: { OR: [{ id: sourceId }, { slug: sourceId }] }, select: { suggested: true } });
      picked = Array.isArray(src?.suggested) ? (src!.suggested as { type?: unknown; id?: unknown }[]) : [];
    }
    for (const ref of picked) {
      if (typeof ref?.type === 'string' && typeof ref?.id === 'string') push(await resolve(ref.type, ref.id));
    }

    // Default: cross-type, highest rated.
    if (out.length < 3) {
      if (sourceType !== 'course') {
        const rs = await this.prisma.course.findMany({ where: { published: true }, orderBy: { rating: 'desc' }, take: 6, select: { slug: true, title: true, thumbnailUrl: true, category: true, rating: true } });
        for (const r of rs) push({ type: 'course', ...r });
      }
      if (sourceType !== 'exam' && out.length < 3) {
        const rs = await this.prisma.exam.findMany({ where: { published: true }, orderBy: { rating: 'desc' }, take: 6, select: { slug: true, title: true, thumbnailUrl: true, rating: true } });
        for (const r of rs) push({ type: 'exam', slug: r.slug, title: r.title, thumbnailUrl: r.thumbnailUrl, category: 'Exam', rating: r.rating });
      }
      if (sourceType !== 'book' && out.length < 3) {
        const rs = await this.prisma.book.findMany({ where: { published: true }, orderBy: { rating: 'desc' }, take: 6, select: { slug: true, title: true, thumbnailUrl: true, category: true, rating: true } });
        for (const r of rs) push({ type: 'book', ...r });
      }
    }
    return out;
  }

  /** Admin: paginated order listing with optional status + search (order no / phone / email / name). */
  async findAll(page = 1, perPage = 20, status?: string, q?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q && q.trim()) {
      const term = q.trim();
      const or: Record<string, unknown>[] = [
        { guestName: { contains: term, mode: 'insensitive' } },
        { guestPhone: { contains: term } },
        { guestEmail: { contains: term, mode: 'insensitive' } },
        { productTitle: { contains: term, mode: 'insensitive' } },
        {
          user: {
            is: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
      const num = Number(term.replace(/\D/g, ''));
      if (!Number.isNaN(num) && num > 0) or.push({ orderNumber: num });
      where.OR = or;
    }
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

    const history = await this.customerHistories(items);
    const withHistory = items.map((o) => ({
      ...o,
      customerHistory: history[this.phoneKey(o.guestPhone || o.user?.phone)] ?? emptyHistory(),
    }));
    return { total, page, perPage, items: withHistory };
  }

  /** Last 11 digits of a phone — the shared key between guests and registered users. */
  private phoneKey(phone?: string | null): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length > 11 ? digits.slice(-11) : digits;
  }

  /** Steadfast delivery record for each customer on the current page. */
  private async customerHistories(
    items: { guestPhone?: string | null; user?: { phone?: string | null } | null }[],
  ): Promise<Record<string, CourierHistory>> {
    const keys = [...new Set(items.map((o) => this.phoneKey(o.guestPhone || o.user?.phone)).filter(Boolean))];
    if (!keys.length) return {};
    const phones = keys.map((k) => `+88${k}`);
    const related = await this.prisma.order.findMany({
      where: {
        OR: [{ guestPhone: { in: phones } }, { user: { is: { phone: { in: phones } } } }],
      },
      select: { guestPhone: true, trackingCode: true, courierStatus: true, user: { select: { phone: true } } },
    });
    const grouped: Record<string, typeof related> = {};
    for (const r of related) {
      const k = this.phoneKey(r.guestPhone || r.user?.phone);
      if (!k) continue;
      (grouped[k] ??= []).push(r);
    }
    const out: Record<string, CourierHistory> = {};
    for (const [k, rows] of Object.entries(grouped)) out[k] = summarizeCourier(rows);
    return out;
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

    if (dto.status === 'PAID' && order.status !== 'PAID') {
      await this.grantAccessForOrder(order);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        refundedAt: dto.status === 'REFUNDED' ? new Date() : undefined,
      },
    });
  }

  /** Admin: edit any order field manually. */
  async adminUpdate(orderId: string, dto: UpdateOrderAdminDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    const data: Record<string, unknown> = {};
    const nullIfEmpty = (v?: string) => (v !== undefined ? (v.trim() ? v.trim() : null) : undefined);
    if (dto.guestName !== undefined) data.guestName = nullIfEmpty(dto.guestName);
    if (dto.guestPhone !== undefined) data.guestPhone = nullIfEmpty(dto.guestPhone);
    if (dto.guestEmail !== undefined) data.guestEmail = nullIfEmpty(dto.guestEmail);
    if (dto.productTitle !== undefined) data.productTitle = dto.productTitle.trim() || order.productTitle;
    if (dto.variant !== undefined) data.variant = nullIfEmpty(dto.variant);
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.deliveryCharge !== undefined) data.deliveryCharge = dto.deliveryCharge;
    if (dto.total !== undefined) data.total = dto.total;
    if (dto.address !== undefined) data.address = nullIfEmpty(dto.address);
    if (dto.region !== undefined) data.region = dto.region;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.txId !== undefined) data.txId = nullIfEmpty(dto.txId);

    const updated = await this.prisma.order.update({ where: { id: orderId }, data });
    if (updated.status === 'PAID' && order.status !== 'PAID') {
      await this.grantAccessForOrder(updated);
    }
    return updated;
  }

  async adminRemove(orderId: string) {
    const exists = await this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Order not found.');
    await this.prisma.order.delete({ where: { id: orderId } });
    return { deleted: orderId };
  }

  /** Admin: bulk delete or bulk status change across multiple orders. */
  async bulk(dto: BulkOrderDto) {
    const ids = (dto.ids ?? []).filter(Boolean);
    if (!ids.length) throw new BadRequestException('No orders selected.');

    if (dto.action === 'DELETE') {
      const res = await this.prisma.order.deleteMany({ where: { id: { in: ids } } });
      return { action: 'DELETE', count: res.count };
    }

    if (!dto.status) throw new BadRequestException('Status is required.');
    const orders = await this.prisma.order.findMany({ where: { id: { in: ids } } });
    await this.prisma.order.updateMany({ where: { id: { in: ids } }, data: { status: dto.status } });
    if (dto.status === 'PAID') {
      for (const o of orders) {
        if (o.status !== 'PAID') await this.grantAccessForOrder(o);
      }
    }
    return { action: 'STATUS', status: dto.status, count: orders.length };
  }

  // ─── Steadfast courier ─────────────────────────────────────────────────────
  courierBalance() {
    return this.steadfast.balance();
  }

  /** Admin: push a hardcopy order to Steadfast and store the tracking code. */
  async sendToSteadfast(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('বাতিল করা অর্ডার Steadfast-এ পাঠানো যাবে না।');
    }
    if (order.trackingCode || order.consignmentId) {
      throw new BadRequestException('This order is already sent to Steadfast.');
    }
    if (!order.isPhysical) throw new BadRequestException('Only hardcopy (physical) orders can be sent to Steadfast.');

    let name = order.guestName ?? '';
    let phone = order.guestPhone ?? '';
    if ((!name || !phone) && order.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
      name = name || user?.name || '';
      phone = phone || user?.phone || '';
    }
    const address = (order.address ?? '').trim();
    if (!address) throw new BadRequestException('This order has no delivery address.');
    if (!phone) throw new BadRequestException('This order has no phone number.');

    const result = await this.steadfast.createConsignment({
      invoice: String(order.orderNumber ?? order.id),
      name: name || 'Customer',
      phone: phone.replace(/^\+88/, ''),
      address,
      codAmount: order.total ?? order.amount,
      note: order.productTitle,
    });

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        consignmentId: result.consignmentId ?? undefined,
        trackingCode: result.trackingCode ?? undefined,
        courierStatus: result.status ?? 'in_review',
      },
    });
    return { ...result, order: updated };
  }

  /** Admin: refresh the courier delivery status from Steadfast. */
  async refreshCourier(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (!order.trackingCode) throw new BadRequestException('No tracking code for this order.');
    const data = await this.steadfast.statusByTracking(order.trackingCode);
    const status = (data.delivery_status as string) ?? order.courierStatus ?? null;
    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { courierStatus: status } });
    return { delivery_status: status, order: updated };
  }

  // ─── Fraud protection & incomplete (abandoned) orders ──────────────────────
  private async assertNotBlocked(userId: string | null, phone: string | null, ip?: string) {
    let p = phone;
    if (userId) {
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
      p = u?.phone ?? null;
    }
    const block = await this.blocked.findBlock(p, ip);
    if (block) {
      throw new ForbiddenException(
        block.type === 'PHONE'
          ? 'এই মোবাইল নম্বর থেকে অর্ডার নেওয়া বন্ধ আছে।'
          : 'এই আইপি থেকে অর্ডার নেওয়া বন্ধ আছে।',
      );
    }
  }

  private async deleteDraft(id?: string) {
    if (!id) return;
    await this.prisma.checkoutDraft.delete({ where: { id } }).catch(() => null);
  }

  private async customerEmailOf(order: { guestEmail: string | null; userId: string | null }): Promise<string | null> {
    if (order.guestEmail) return order.guestEmail;
    if (order.userId) {
      const u = await this.prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
      return u?.email ?? null;
    }
    return null;
  }

  /** Fire-and-forget emails: admin on every order, customer when we have an email. */
  private async sendOrderEmails(
    order: {
      orderNumber: number | null;
      guestName: string | null;
      guestPhone: string | null;
      guestEmail: string | null;
      userId: string | null;
      productTitle: string;
      productType: string;
      quantity: number;
      amount: number;
      discount: number;
      deliveryCharge: number;
      total: number;
      paymentMethod: string;
      address: string | null;
      region: string | null;
      isPhysical: boolean;
      items: unknown;
    },
    kind: 'placed' | 'paid',
  ) {
    try {
      const admin = this.config.get<string>('ADMIN_EMAIL') || 'nazmulhasanasheky@gmail.com';
      const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];
      const itemsHtml = items.length
        ? items.map((i) => `<li>${i.title ?? order.productTitle} ×${i.quantity ?? 1}${i.variant ? ` (${i.variant})` : ""}</li>`).join("")
        : `<li>${order.productTitle} ×${order.quantity}</li>`;
      const money = (n: number) => `৳${Number(n || 0).toLocaleString("en-IN")}`;
      const cust = order.guestName || "Customer";
      const wrap = (title: string, body: string) =>
        `<!doctype html><html><body style="margin:0;background:#0a0e1a;font-family:Arial,sans-serif;color:#e2e8f0"><div style="max-width:560px;margin:32px auto;background:#111827;border:1px solid #1e293b;border-radius:16px;overflow:hidden"><div style="padding:24px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a"><h1 style="margin:0;font-size:20px">Shohoz Skill</h1><p style="margin:4px 0 0;font-size:12px">Learn to Earn</p></div><div style="padding:24px"><h2 style="margin:0 0 8px;font-size:18px;color:#f8fafc">${title}</h2>${body}</div><div style="padding:14px 24px;border-top:1px solid #1e293b;color:#475569;font-size:11px">সহজ স্কিল · shohozskill.com.bd</div></div></body></html>`;

      const adminBody = `<p style="color:#94a3b8;font-size:14px">${kind === "paid" ? "পেমেন্ট সম্পন্ন হয়েছে" : "নতুন অর্ডার এসেছে"}।</p>
        <table style="width:100%;font-size:14px;color:#e2e8f0"><tr><td style="color:#94a3b8">Order No</td><td style="text-align:right;font-weight:bold">#${order.orderNumber ?? "-"}</td></tr>
        <tr><td style="color:#94a3b8">Name</td><td style="text-align:right">${cust}</td></tr>
        <tr><td style="color:#94a3b8">Phone</td><td style="text-align:right">${order.guestPhone || "-"}</td></tr>
        <tr><td style="color:#94a3b8">Payment</td><td style="text-align:right">${order.paymentMethod}</td></tr>
        <tr><td style="color:#94a3b8">Items</td><td style="text-align:right">${order.productTitle}</td></tr>
        <tr><td style="color:#94a3b8">Total</td><td style="text-align:right;font-weight:bold;color:#f59e0b">${money(order.total ?? order.amount)}</td></tr>
        <tr><td style="color:#94a3b8">Address</td><td style="text-align:right">${order.address || "-"}${order.region ? ` (${order.region})` : ""}</td></tr></table>`;
      void this.mail.sendRaw(admin, `নতুন অর্ডার #${order.orderNumber ?? ""} (${kind === "paid" ? "PAID" : "placed"})`, wrap("নতুন অর্ডার", adminBody));

      const custEmail = await this.customerEmailOf(order);
      if (custEmail) {
        const digital = items.length ? items.some((i) => !i.isPhysical) : !order.isPhysical;
        const custBody = `<p style="color:#94a3b8;font-size:14px">প্রিয় <strong style="color:#f8fafc">${cust}</strong>, আপনার অর্ডারটি ${kind === "paid" ? "সফলভাবে পরিশোধিত হয়েছে" : "গৃহীত হয়েছে"}।</p>
          <ul style="color:#e2e8f0;font-size:14px">${itemsHtml}</ul>
          <p style="color:#e2e8f0;font-size:15px">সর্বমোট: <strong style="color:#f59e0b">${money(order.total ?? order.amount)}</strong></p>
          ${digital ? `<p style="color:#94a3b8;font-size:13px">ডিজিটাল কোর্স / PDF / Exam পেতে <a href="https://shohozskill.com.bd/login" style="color:#f59e0b">লগইন</a> করুন — অ্যাক্সেস আপনার একাউন্টে যোগ হয়েছে।</p>` : `<p style="color:#94a3b8;font-size:13px">আগামী ২-৩ দিনের মধ্যে বইটি হাতে পেয়ে যাবেন। ডেলিভারি ম্যানের কলটি ধরবেন।</p>`}
          <p style="color:#64748b;font-size:12px">Order No: #${order.orderNumber ?? "-"}</p>`;
        void this.mail.sendRaw(custEmail, `অর্ডার #${order.orderNumber ?? ""} — Shohoz Skill`, wrap("আপনার অর্ডার গৃহীত হয়েছে", custBody));
      }
    } catch (err) {
      void err;
    }
  }

  /** Public: save/update an incomplete checkout draft. */
  async saveDraft(dto: SaveDraftDto, meta: CheckoutMeta = {}) {
    const data: Prisma.CheckoutDraftUncheckedCreateInput = {
      name: dto.name?.trim() || null,
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim() || null,
      address: dto.address?.trim() || null,
      region: dto.region ?? null,
      paymentMethod: dto.paymentMethod ?? null,
      items: (dto.items ?? undefined) as Prisma.InputJsonValue | undefined,
      note: dto.note?.trim() || null,
      ipAddress: meta.ip ?? null,
      device: meta.device ?? null,
      userAgent: meta.userAgent ?? null,
    };
    if (dto.id) {
      const exists = await this.prisma.checkoutDraft.findUnique({ where: { id: dto.id }, select: { id: true } });
      if (exists) {
        const updated = await this.prisma.checkoutDraft.update({ where: { id: dto.id }, data });
        return { id: updated.id };
      }
    }
    const created = await this.prisma.checkoutDraft.create({ data });
    return { id: created.id };
  }

  listDrafts() {
    return this.prisma.checkoutDraft.findMany({ orderBy: { updatedAt: 'desc' }, take: 200 });
  }

  async removeDraft(id: string) {
    await this.prisma.checkoutDraft.delete({ where: { id } }).catch(() => null);
    return { deleted: id };
  }

  /** Admin: refresh courier status for all non-final Steadfast orders. */
  async refreshAllCouriers() {
    const orders = await this.prisma.order.findMany({
      where: {
        trackingCode: { not: null },
        courierStatus: { notIn: ['delivered', 'returned', 'cancelled', 'partial_delivered'] },
      },
      select: { id: true, trackingCode: true, courierStatus: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    let updated = 0;
    for (const o of orders) {
      if (!o.trackingCode) continue;
      try {
        const data = await this.steadfast.statusByTracking(o.trackingCode);
        const status = (data.delivery_status as string) ?? null;
        if (status && status !== o.courierStatus) {
          await this.prisma.order.update({ where: { id: o.id }, data: { courierStatus: status } });
          updated++;
        }
      } catch {
        /* ignore per-order failures */
      }
    }
    return { checked: orders.length, updated };
  }

  private async grantAccess(userId: string, productType: string, productId: string, giftFrom: string | null = null, depth = 0) {
    await this.prisma.enrollment.upsert({
      where: { userId_productType_productId: { userId, productType, productId } },
      create: { userId, productType, productId, accessFrom: new Date(), giftFrom },
      update: {},
    });
    // Purchasing a course also unlocks its configured free gifts.
    if (productType === 'course' && depth < 2) {
      const course = await this.prisma.course.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] },
        select: { title: true, gift: true },
      });
      const gifts = Array.isArray(course?.gift) ? (course!.gift as { type?: unknown; id?: unknown }[]) : [];
      for (const g of gifts) {
        if (typeof g?.type === 'string' && typeof g?.id === 'string') {
          await this.grantAccess(userId, g.type, g.id, course?.title ?? 'Course', depth + 1);
        }
      }
    }
  }

  // --- SSLCOMMERZ HANDLERS ---
  private getCredentials() {
    const clean = (val: any) => (val ? String(val).replace(/['"`\s]/g, '') : '');
    const rawEnvId = clean(this.config.get('SSLCOMMERZ_STORE_ID'));
    const rawEnvPass = clean(this.config.get('SSLCOMMERZ_STORE_PASS'));
    
    // Only use env credentials if they match real merchant pattern and have both ID and password
    const hasValidEnvCreds = rawEnvId && rawEnvId.includes('shohoz') && rawEnvPass && rawEnvPass.length >= 8;
    const storeId = hasValidEnvCreds ? rawEnvId : 'shohozskillcombd0live';
    const storePass = hasValidEnvCreds ? rawEnvPass : '69F07E8E9B34A63050';
    const isLive = true;

    return { storeId, storePass, isLive };
  }

  private getSslcz() {
    const { storeId, storePass, isLive } = this.getCredentials();
    return new SSLCommerzPayment(storeId, storePass, isLive);
  }

  async checkSslDiag() {
    const clean = (val: any) => (val ? String(val).replace(/['"`\s]/g, '') : '');
    const rawEnvId = this.config.get('SSLCOMMERZ_STORE_ID');
    const rawEnvPass = this.config.get('SSLCOMMERZ_STORE_PASS');
    const rawEnvLive = this.config.get('SSLCOMMERZ_IS_LIVE');

    const cleanId = clean(rawEnvId) || 'shohozskillcombd0live';
    const cleanPass = clean(rawEnvPass) || '69F07E8E9B34A63050';

    const testData = {
      total_amount: 10,
      currency: 'BDT',
      tran_id: 'DIAG-' + Date.now(),
      success_url: 'https://shohozskill.com.bd/success',
      fail_url: 'https://shohozskill.com.bd/fail',
      cancel_url: 'https://shohozskill.com.bd/cancel',
      ipn_url: 'https://shohozskill.com.bd/ipn',
      shipping_method: 'No',
      product_name: 'Diag Test',
      product_category: 'Diag',
      product_profile: 'general',
      cus_name: 'Diag Customer',
      cus_email: 'diag@shohozskill.com',
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
    };

    let resConfigured: any = null;
    let resHardcoded: any = null;

    try {
      const ssl1 = new SSLCommerzPayment(cleanId, cleanPass, true);
      resConfigured = await ssl1.init(testData);
    } catch (e: any) {
      resConfigured = { error: e?.message };
    }

    try {
      const ssl2 = new SSLCommerzPayment('shohozskillcombd0live', '69F07E8E9B34A63050', true);
      resHardcoded = await ssl2.init(testData);
    } catch (e: any) {
      resHardcoded = { error: e?.message };
    }

    return {
      envInfo: {
        hasRawEnvId: !!rawEnvId,
        rawEnvIdMasked: rawEnvId ? `${String(rawEnvId).slice(0, 4)}...${String(rawEnvId).slice(-4)}` : null,
        rawEnvPassLength: rawEnvPass ? String(rawEnvPass).length : null,
        rawEnvLive,
      },
      configuredLiveTest: {
        cleanIdMasked: `${cleanId.slice(0, 4)}...${cleanId.slice(-4)}`,
        status: resConfigured?.status,
        failedreason: resConfigured?.failedreason,
        hasGatewayUrl: !!resConfigured?.GatewayPageURL,
      },
      verifiedLiveTest: {
        status: resHardcoded?.status,
        failedreason: resHardcoded?.failedreason,
        hasGatewayUrl: !!resHardcoded?.GatewayPageURL,
      },
    };
  }

  async handleSslCallback(orderId: string, body: any, event: 'SUCCESS' | 'FAIL' | 'CANCEL'): Promise<string> {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'https://shohozskill.com.bd';
    const lookupId = orderId || body?.tran_id || body?.orderId;
    const order = lookupId
      ? await this.prisma.order.findFirst({
          where: { OR: [{ id: lookupId }, { txId: lookupId }] },
        })
      : null;

    if (!order) return `${frontendUrl}/checkout/success?status=FAILED&reason=not_found`;

    const digital = order.isPhysical ? '0' : '1';

    if (event === 'SUCCESS') {
      try {
        if (body?.val_id) {
          const sslcz = this.getSslcz();
          const isValid = await sslcz.validate({ val_id: body.val_id });
          if (isValid) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: { status: 'PAID', txId: body.bank_tran_id || body.tran_id || order.txId },
            });
            await this.grantAccessForOrder(order);
            this.trackPurchase(order);
            void this.sendOrderEmails(order, 'paid');
            return `${frontendUrl}/checkout/success?orderId=${order.id}&method=SSLCOMMERZ&status=PAID&digital=${digital}`;
          }
        }
        if (body?.status === 'VALID' || body?.status === 'VALIDATED') {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'PAID', txId: body.bank_tran_id || body.tran_id || order.txId },
          });
          if (order.userId && !order.isPhysical) {
            await this.grantAccess(order.userId, order.productType, order.productId);
          }
          this.trackPurchase(order);
          return `${frontendUrl}/checkout/success?orderId=${order.id}&method=SSLCOMMERZ&status=PAID&digital=${digital}`;
        }
      } catch (err) {
        console.error('SSL validation error:', err);
      }
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', txId: body?.bank_tran_id || body?.tran_id || order.txId },
      });
      if (order.userId && !order.isPhysical) {
        await this.grantAccess(order.userId, order.productType, order.productId);
      }
      this.trackPurchase(order);
      return `${frontendUrl}/checkout/success?orderId=${order.id}&method=SSLCOMMERZ&status=PAID&digital=${digital}`;
    } else {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: event === 'CANCEL' ? 'CANCELLED' : 'FAILED' },
      });
      return `${frontendUrl}/checkout/success?orderId=${order.id}&method=SSLCOMMERZ&status=${event === 'CANCEL' ? 'CANCELLED' : 'FAILED'}&digital=${digital}`;
    }
  }

  async handleSslIpn(body: any) {
    if (!body || !body.tran_id) return { message: 'Invalid IPN' };
    
    const txId = body.tran_id;
    const order = await this.prisma.order.findFirst({ where: { txId } });
    if (!order) return { message: 'Order not found' };

    if (body.status === 'VALID' || body.status === 'VALIDATED') {
       try {
         const sslcz = this.getSslcz();
         const isValid = await sslcz.validate(body);
          if (isValid && order.status !== 'PAID') {
             await this.prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
             await this.grantAccessForOrder(order);
             this.trackPurchase(order);
          }
       } catch (err) {
         console.error('IPN Validation Error:', err);
       }
    } else if (body.status === 'FAILED' || body.status === 'CANCELLED') {
       if (order.status === 'PENDING') {
         await this.prisma.order.update({ where: { id: order.id }, data: { status: body.status } });
       }
    }
    return { message: 'IPN Processed' };
  }
}

function randomRef() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

type CourierHistory = {
  total: number;
  sent: number;
  delivered: number;
  cancelled: number;
  returned: number;
  inProgress: number;
};

function emptyHistory(): CourierHistory {
  return { total: 0, sent: 0, delivered: 0, cancelled: 0, returned: 0, inProgress: 0 };
}

function summarizeCourier(rows: { trackingCode: string | null; courierStatus: string | null }[]): CourierHistory {
  const h = emptyHistory();
  h.total = rows.length;
  for (const r of rows) {
    if (!r.trackingCode) continue;
    h.sent++;
    const st = (r.courierStatus ?? 'in_review').toLowerCase();
    if (st.includes('cancel')) h.cancelled++;
    else if (st.includes('return')) h.returned++;
    else if (st.includes('deliver')) h.delivered++;
    else h.inProgress++;
  }
  return h;
}
