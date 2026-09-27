import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { devices: { orderBy: { lastActive: 'desc' } } },
    });
    if (!user) throw new NotFoundException('User not found.');
    const { password, ...safe } = user;
    void password;
    return safe;
  }

  async myEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myProgress(userId: string) {
    return this.prisma.progressItem.findMany({ where: { userId } });
  }

  async myAttempts(userId: string) {
    return this.prisma.examAttempt.findMany({
      where: { userId },
      include: { exam: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 25,
    });
  }

  /** Admin: paginated user listing with optional search. */
  async findAll(query?: string, page = 1, perPage = 20) {
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { devices: { orderBy: { lastActive: 'desc' } } },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { joinedAt: 'desc' },
      }),
    ]);
    const safeItems = items.map(({ password: _pw, ...safe }) => safe);
    return { total, page, perPage, items: safeItems };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { devices: { orderBy: { lastActive: 'desc' } } },
    });
    if (!user) throw new NotFoundException('User not found.');
    const { password, ...safe } = user;
    void password;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    const { password, ...rest } = dto;
    const user = await this.prisma.user.update({
      where: { id },
      data: password ? { ...rest, password: password } : rest,
    });
    const { password: _pw, ...safe } = user;
    void _pw;
    return safe;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.$transaction([
      // Order & Enrollment have no ON DELETE cascade — remove them explicitly.
      this.prisma.order.deleteMany({ where: { userId: id } }),
      this.prisma.enrollment.deleteMany({ where: { userId: id } }),
      // The rest cascade via the schema.
      this.prisma.user.delete({ where: { id } }),
    ]);
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('User not found.');
  }
}
