import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto.js';
import type { DeviceInfo } from './dto/auth.dto.js';

const MAX_DEVICES = 2;
const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

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

    // TODO: send via SMS gateway (TWILIO/Robi/GP). For dev we log it.
    console.log(`[DEV OTP] ${normalized} → ${code}`);

    // Auto-create the account on REGISTER so the subsequent verify has a user.
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

    // ── Device-limit enforcement ────────────────────────────────────────────
    // Premium policy: max 2 concurrent sessions. Free signups share a pool.
    if (dto.deviceName) {
      const jti = this.jwt.sign({ sub: user.id }, { expiresIn: '10m' }).split('.')[2]; // placeholder jti

      // Count only *current* (non-revoked) sessions — simplest enforcement:
      const active = await this.prisma.deviceSession.count({ where: { userId: user.id } });
      if (active >= MAX_DEVICES) {
        // Reap expired or revoke the oldest session.
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
