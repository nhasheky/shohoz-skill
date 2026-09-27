import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBlogPostDto } from './dto/create-blog-post.dto.js';
import type { UpdateBlogPostDto } from './dto/update-blog-post.dto.js';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post || !post.published) throw new NotFoundException('Blog post not found.');
    return post;
  }

  async create(dto: CreateBlogPostDto) {
    const { content, tags, scheduledFor, ...scalars } = dto;
    return this.prisma.blogPost.create({
      data: {
        ...scalars,
        tags: tags ?? [],
        content: (content as object[]) ?? [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.ensureExists(id);
    const { content, tags, scheduledFor, ...scalars } = dto;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...scalars,
        ...(tags ? { tags } : {}),
        ...(content ? { content: content as object[] } : {}),
        ...(scheduledFor ? { scheduledFor: new Date(scheduledFor) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.blogPost.delete({ where: { id } });
    return { deleted: id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.blogPost.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Blog post not found.');
  }
}
