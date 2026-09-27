import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateBookDto } from './dto/create-book.dto.js';
import type { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.book.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const book = await this.prisma.book.findUnique({ where: { slug } });
    if (!book || !book.published) throw new NotFoundException('Book not found.');
    return book;
  }

  async create(dto: CreateBookDto) {
    return this.prisma.book.create({ data: dto });
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.ensureExists(id);
    return this.prisma.book.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.book.delete({ where: { id } });
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.book.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Book not found.');
  }
}
