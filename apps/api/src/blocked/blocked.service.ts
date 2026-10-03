import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizePhone, phoneDigits } from '../common/phone.js';

@Injectable()
export class BlockedService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.blockedContact.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async add(type: string, value: string, reason?: string) {
    if (type !== 'PHONE' && type !== 'IP') throw new BadRequestException('Type must be PHONE or IP.');
    const cleanValue = type === 'PHONE' ? normalizePhone(value) ?? value.trim() : value.trim();
    if (!cleanValue) throw new BadRequestException('Value is required.');
    const existing = await this.prisma.blockedContact.findFirst({ where: { type, value: cleanValue } });
    if (existing) return existing;
    return this.prisma.blockedContact.create({ data: { type, value: cleanValue, reason: reason?.trim() || null } });
  }

  async remove(id: string) {
    const exists = await this.prisma.blockedContact.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Blocked entry not found.');
    await this.prisma.blockedContact.delete({ where: { id } });
    return { deleted: id };
  }

  /** The matching block entry for a phone/IP, or null. */
  async findBlock(phone?: string | null, ip?: string | null) {
    if (phone) {
      const normalized = normalizePhone(phone);
      const digits = phoneDigits(phone);
      const candidates = [normalized, digits, digits.slice(-11)].filter(Boolean) as string[];
      const row = await this.prisma.blockedContact.findFirst({ where: { type: 'PHONE', value: { in: candidates } } });
      if (row) return row;
    }
    if (ip) {
      const row = await this.prisma.blockedContact.findFirst({ where: { type: 'IP', value: ip } });
      if (row) return row;
    }
    return null;
  }
}
