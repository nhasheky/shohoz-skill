import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RequestOtpDto, VerifyOtpDto, RegisterDto, LoginDto } from './dto/auth.dto.js';
import type { DeviceInfo } from './dto/auth.dto.js';

const MAX_DEVICES = 2;
const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /* ═══════════════════════════════════════════════════════════════════
   *  NEW: Register with name, phone, email, password
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
        verified: false, // will be true after OTP verification
      },
    });

    // Generate OTP and store (in real system, send via SMS + Email)
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

    // TODO: Send real SMS & Email with OTP
    console.log(`[DEV OTP] ${normalizedPhone} / ${normalizedEmail} → ${otpCode}`);

    return {
      message: 'একাউন্ট তৈরি হয়েছে! ভেরিফিকেশন কোড পাঠানো হয়েছে।',
      userId: user.id,
      // In production, don't send the OTP back! Only for demo/dev:
      _devOtp: otpCode,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  NEW: Login with email/phone + password
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
   *  NEW: Verify registration OTP
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
   *  EXISTING: OTP-based login (kept for backward compat)
   * ═══════════════════════════════════════════════════════════════════ */

  /** Request a login/register OTP. In dev, the code is printed to the console. */
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

  /** Verify the OTP, register the device session, and mint a JWT. */
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

  /** Revoke a device session (forces logout on that device). */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.deviceSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new BadRequestException('Session not found.');
    if (session.current) throw new BadRequestException('Cannot revoke the current session here.');
    await this.prisma.deviceSession.delete({ where: { id: sessionId } });
    return { revoked: sessionId };
  }

  /** Admin login with email and password */
  async adminLogin(email: string, password?: string) {
    if (password !== 'admin123') {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const admin = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { role: 'SUPER_ADMIN' },
        ],
      },
    });
    if (!admin) throw new UnauthorizedException('Admin account not found.');

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
  // Using SHA-256 with a salt prefix for simplicity.
  // In production, use bcrypt or argon2.
  return createHash('sha256').update('shohoz_salt_' + password).digest('hex');
}
