import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateContactMessageDto,
  UpdateContactMessageStatusDto,
  UpdatePageContentDto,
  UpdateSiteSettingDto,
} from './dto/cms.dto.js';

/** Fallback values used when the singleton SiteSetting row has not been created yet. */
export const DEFAULT_SITE_SETTINGS = {
  id: 'default',
  logoUrl: null as string | null,
  siteTitle: 'Shohoz Skill',
  siteTitleBn: 'সহজ স্কিল',
  faviconUrl: null as string | null,
  metaDescription:
    "Bangladesh's fastest learning platform for government-job preparation — courses, MCQ exams, and books. Learn to Earn.",
  ogImageUrl: null as string | null,
  keywords: [] as string[],
  supportEmail: 'support@shohozskill.com',
  supportPhone: '+880 1700-000000',
  address: 'Level 4, Dhanmondi, Dhaka 1209, Bangladesh',
  socials: null as unknown,
  deliveryChargeDhaka: 60,
  deliveryChargeOutside: 120,
  codEnabled: true,
  sslcommerzEnabled: true,
  reviewScrollSeconds: 6,
};

const VALID_PAGES = ['home', 'about', 'contact'];

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: site-wide branding / SEO / delivery configuration. */
  async getSettings() {
    const row = await this.prisma.siteSetting.findUnique({ where: { id: 'default' } });
    return row ?? DEFAULT_SITE_SETTINGS;
  }

  /** Admin: update (or create) the singleton settings row. */
  async updateSettings(dto: UpdateSiteSettingDto) {
    return this.prisma.siteSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...dto },
      update: { ...dto },
    });
  }

  /** Public: editable content blocks for a CMS-managed page. */
  async getPage(page: string) {
    const row = await this.prisma.pageContent.findUnique({ where: { page } });
    if (row) return row;
    return { id: null, page, data: {}, createdAt: null, updatedAt: null };
  }

  /** Admin: all editable pages. */
  async listPages() {
    const rows = await this.prisma.pageContent.findMany({ orderBy: { page: 'asc' } });
    return VALID_PAGES.map((page) => rows.find((r) => r.page === page) ?? { id: null, page, data: {}, createdAt: null, updatedAt: null });
  }

  /** Admin: create/update a page's content. */
  async updatePage(page: string, dto: UpdatePageContentDto) {
    const data = (dto.data ?? {}) as object;
    return this.prisma.pageContent.upsert({
      where: { page },
      create: { page, data },
      update: { data },
    });
  }

  /** Public: store a contact form submission. */
  async createContactMessage(dto: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({ data: { ...dto } });
  }

  /** Admin: paginated contact messages, optionally filtered by status. */
  async listMessages(status?: string, page = 1, perPage = 20) {
    const where = status ? { status } : {};
    const [total, items] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page, perPage, items };
  }

  async updateMessageStatus(id: string, dto: UpdateContactMessageStatusDto) {
    const exists = await this.prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Contact message not found.');
    return this.prisma.contactMessage.update({ where: { id }, data: { status: dto.status } });
  }

  async deleteMessage(id: string) {
    const exists = await this.prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Contact message not found.');
    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: id };
  }
}
