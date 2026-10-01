import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { slugify } from '../common/slug.js';
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
    const { content, tags, scheduledFor, slug: rawSlug, ...scalars } = dto;
    const slug = await this.uniqueSlug(slugify(String(rawSlug ?? '').trim() || String(dto.title ?? '').trim()));
    return this.prisma.blogPost.create({
      data: {
        ...scalars,
        slug,
        tags: tags ?? [],
        content: (content as object[]) ?? [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.ensureExists(id);
    const { content, tags, scheduledFor, slug: rawSlug, ...scalars } = dto;
    const data: Record<string, unknown> = {
      ...scalars,
      ...(tags ? { tags } : {}),
      ...(content ? { content: content as object[] } : {}),
      ...(scheduledFor ? { scheduledFor: new Date(scheduledFor) } : {}),
    };
    if (rawSlug !== undefined && String(rawSlug).trim()) {
      data.slug = await this.uniqueSlug(slugify(String(rawSlug).trim()), id);
    }
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = base || `post-${Date.now().toString(36)}`;
    let slug = root;
    let n = 2;
    while (
      await this.prisma.blogPost.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      })
    ) {
      slug = `${root}-${n++}`;
    }
    return slug;
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
