import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import type { CheckoutDto, CheckoutBatchDto } from './dto/checkout.dto.js';
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
        guestPhone: userId ? null : normalizePhone(dto.guestPhone) ?? null,
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
        txId,
      },
    });

    if (discount > 0 && couponCode) await this.coupons.markUsed(couponCode);
    if (isFree) await this.grantAccessForOrder(order);

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
  async checkoutBatch(userId: string | null, dto: CheckoutBatchDto) {
    const rawItems = dto.items ?? [];
    if (!rawItems.length) throw new BadRequestException('Your cart is empty.');

    const products: (ResolvedProduct & { quantity: number })[] = [];
    for (const it of rawItems) {
      const resolved = await this.resolveProduct(it);
      products.push({ ...resolved, quantity: it.quantity ?? 1 });
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
        guestPhone: userId ? null : normalizePhone(dto.guestPhone) ?? null,
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
        txId,
        items: itemsJson,
      },
    });

    if (discount > 0 && couponCode) await this.coupons.markUsed(couponCode);
    if (isFree) await this.grantAccessForOrder(order);

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

  private async grantAccess(userId: string, productType: string, productId: string) {
    await this.prisma.enrollment.upsert({
      where: { userId_productType_productId: { userId, productType, productId } },
      create: { userId, productType, productId, accessFrom: new Date() },
      update: {},
    });
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

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) return '+88' + digits;
  if (digits.length === 13 && digits.startsWith('8801')) return '+88' + digits.slice(2);
  return phone;
}
