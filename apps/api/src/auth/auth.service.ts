import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from './mail.service.js';
import type { RequestOtpDto, VerifyOtpDto, RegisterDto, LoginDto } from './dto/auth.dto.js';
import type { DeviceInfo } from './dto/auth.dto.js';

const MAX_DEVICES = 2;
const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  /* ═══════════════════════════════════════════════════════════════════
   *  Register with name, phone, email, password
   * ═══════════════════════════════════════════════════════════════════ */
  async register(dto: RegisterDto) {
    const normalizedPhone = normalizePhone(dto.phone);
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if phone or email already taken
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { email: normalizedEmail },
        ],
      },
    });

    if (existing) {
      if (existing.phone === normalizedPhone) {
        throw new ConflictException('এই মোবাইল নম্বর দিয়ে আগে থেকেই একাউন্ট আছে। লগইন করুন।');
      }
      throw new ConflictException('এই ইমেইল দিয়ে আগে থেকেই একাউন্ট আছে। লগইন করুন।');
    }

    // Hash the password
    const passwordHash = hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        password: passwordHash,
        role: 'STUDENT',
        verified: false,
      },
    });

    // Generate 4-digit OTP
    const otpCode = randomInt(1000, 9999).toString();
    const codeHash = hash(otpCode);

    await this.prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        codeHash,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    // Send OTP via email (real)
    const emailSent = await this.mail.sendOtp(normalizedEmail, otpCode, dto.name.trim());

    return {
      message: emailSent
        ? 'একাউন্ট তৈরি হয়েছে! আপনার ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে।'
        : 'একাউন্ট তৈরি হয়েছে! কিন্তু ইমেইল পাঠাতে সমস্যা হয়েছে।',
      userId: user.id,
      emailSent,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  Login with email/phone + password
   * ═══════════════════════════════════════════════════════════════════ */
  async login(dto: LoginDto) {
    const id = dto.identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
    const isPhone = /^01\d{9}$/.test(id.replace(/\D/g, ''));

    if (!isEmail && !isPhone) {
      throw new BadRequestException('সঠিক ইমেইল অথবা মোবাইল নম্বর দিন।');
    }

    // Find user
    let user;
    if (isEmail) {
      user = await this.prisma.user.findFirst({
        where: { email: id.toLowerCase().trim() },
      });
    } else {
      const normalizedPhone = normalizePhone(id.replace(/\D/g, ''));
      user = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });
    }

    if (!user) {
      throw new UnauthorizedException('এই ইমেইল/মোবাইল দিয়ে কোনো একাউন্ট পাওয়া যায়নি।');
    }

    // Validate password
    if (!user.password) {
      throw new UnauthorizedException('এই একাউন্টে পাসওয়ার্ড সেট করা হয়নি। OTP দিয়ে লগইন করুন।');
    }

    const passwordHash = hashPassword(dto.password);
    if (passwordHash !== user.password) {
      throw new UnauthorizedException('পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('আপনার একাউন্ট সাসপেন্ড করা হয়েছে।');
    }

    await this.mergeGuestOrders(user);

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  Verify registration OTP
   * ═══════════════════════════════════════════════════════════════════ */
  async verifyRegistrationOtp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('ইউজার পাওয়া যায়নি।');

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone: user.phone, purpose: 'REGISTER', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || hash(code) !== otp.codeHash) {
      throw new UnauthorizedException('ভুল কোড। সঠিক ভেরিফিকেশন কোড দিন।');
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('কোডের মেয়াদ শেষ। নতুন কোড নিন।');
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    // Mark user as verified
    await this.prisma.user.update({ where: { id: userId }, data: { verified: true } });

    // Attach any guest orders placed with this phone/email.
    await this.mergeGuestOrders(user);

    // Issue JWT
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: true,
      },
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  Resend OTP (for registration verification)
   * ═══════════════════════════════════════════════════════════════════ */
  async resendOtp(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('ইউজার পাওয়া যায়নি।');
    if (user.verified) throw new BadRequestException('একাউন্ট ইতোমধ্যে ভেরিফাইড।');

    // Generate new OTP
    const otpCode = randomInt(1000, 9999).toString();
    const codeHash = hash(otpCode);

    await this.prisma.otpCode.create({
      data: {
        phone: user.phone,
        codeHash,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    // Send via email
    const emailSent = user.email
      ? await this.mail.sendOtp(user.email, otpCode, user.name)
      : false;

    return {
      message: emailSent
        ? 'নতুন কোড আপনার ইমেইলে পাঠানো হয়েছে।'
        : 'কোড পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      emailSent,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  EXISTING: OTP-based login (kept for backward compat)
   * ═══════════════════════════════════════════════════════════════════ */

  async requestOtp(dto: RequestOtpDto) {
    const normalized = normalizePhone(dto.phone);
    const code = randomInt(100000, 999999).toString();
    const codeHash = hash(code);

    await this.prisma.otpCode.create({
      data: {
        phone: normalized,
        codeHash,
        purpose: dto.purpose ?? 'LOGIN',
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    console.log(`[DEV OTP] ${normalized} → ${code}`);

    if (dto.purpose === 'REGISTER') {
      await this.prisma.user.upsert({
        where: { phone: normalized },
        create: { phone: normalized, name: dto.name ?? 'New Learner', role: 'STUDENT' },
        update: {},
      });
    }

    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: VerifyOtpDto, device?: DeviceInfo) {
    const normalized = normalizePhone(dto.phone);
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone: normalized, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || hash(dto.code) !== otp.codeHash) {
      throw new UnauthorizedException('Invalid or expired code.');
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Code expired — request a new one.');
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    const user = await this.prisma.user.upsert({
      where: { phone: normalized },
      create: { phone: normalized, name: 'New Learner', role: 'STUDENT', verified: true },
      update: { verified: true },
    });

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active.');

    await this.mergeGuestOrders(user);

    if (dto.deviceName) {
      const jti = this.jwt.sign({ sub: user.id }, { expiresIn: '10m' }).split('.')[2];
      const active = await this.prisma.deviceSession.count({ where: { userId: user.id } });
      if (active >= MAX_DEVICES) {
        const oldest = await this.prisma.deviceSession.findFirst({
          where: { userId: user.id },
          orderBy: { lastActive: 'asc' },
        });
        if (oldest) await this.prisma.deviceSession.delete({ where: { id: oldest.id } });
      }

      await this.prisma.deviceSession.updateMany({ where: { userId: user.id }, data: { current: false } });
      await this.prisma.deviceSession.create({
        data: {
          userId: user.id,
          deviceName: device?.deviceName ?? dto.deviceName ?? 'Unknown device',
          browser: device?.browser,
          os: device?.os,
          ip: device?.ip,
          tokenJti: jti,
          current: true,
        },
      });
    }

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.deviceSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new BadRequestException('Session not found.');
    if (session.current) throw new BadRequestException('Cannot revoke the current session here.');
    await this.prisma.deviceSession.delete({ where: { id: sessionId } });
    return { revoked: sessionId };
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  Account merging: attach guest orders once a user verifies.
   * ═══════════════════════════════════════════════════════════════════ */
  private async mergeGuestOrders(user: { id: string; phone: string; email?: string | null }) {
    const localPhone = user.phone.replace(/^\+88/, '');
    const or: { guestPhone?: string; guestEmail?: string }[] = [{ guestPhone: user.phone }];
    if (localPhone !== user.phone) or.push({ guestPhone: localPhone });
    if (user.email) or.push({ guestEmail: user.email.toLowerCase().trim() });

    const orders = await this.prisma.order.findMany({
      where: { userId: null, OR: or },
      select: { id: true, status: true, isPhysical: true, productType: true, productId: true },
    });
    if (!orders.length) return { merged: 0 };

    await this.prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { userId: user.id },
    });

    // Unlock access for guest purchases that were already paid.
    for (const order of orders) {
      if (order.status === 'PAID' && !order.isPhysical) {
        await this.prisma.enrollment.upsert({
          where: {
            userId_productType_productId: {
              userId: user.id,
              productType: order.productType,
              productId: order.productId,
            },
          },
          create: {
            userId: user.id,
            productType: order.productType,
            productId: order.productId,
            accessFrom: new Date(),
          },
          update: {},
        });
      }
    }
    return { merged: orders.length };
  }

  async adminLogin(email: string, password?: string) {
    if (!password) {
      throw new UnauthorizedException('Password is required.');
    }
    
    const admin = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
    
    if (!admin) {
      throw new UnauthorizedException('Admin account not found.');
    }
    
    if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }
    
    if (!admin.password) {
      throw new UnauthorizedException('This account has no password set. Please login via OTP and set a password.');
    }
    
    if (hashPassword(password) !== admin.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { sub: admin.id, phone: admin.phone, role: admin.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    };
  }

  async listSessions(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
    });
  }
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 11 || !digits.startsWith('01')) {
    throw new BadRequestException('Phone must be an 11-digit Bangladeshi number (01XXXXXXXXX).');
  }
  return '+88' + digits;
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function hashPassword(password: string) {
  return createHash('sha256').update('shohoz_salt_' + password).digest('hex');
}
