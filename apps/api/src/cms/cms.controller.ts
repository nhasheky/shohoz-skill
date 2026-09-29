import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service.js';
import { CreateContactMessageDto, UpdateSiteSettingDto, UpdatePageContentDto } from './dto/cms.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

/** Public (no auth) CMS endpoints consumed by the Next.js storefront. */
@Controller()
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Get('site-settings')
  settings() {
    return this.cms.getSettings();
  }

  @Get('pages/:page')
  page(@Param('page') page: string) {
    return this.cms.getPage(page);
  }

  @Post('contact-messages')
  contact(@Body() dto: CreateContactMessageDto) {
    return this.cms.createContactMessage(dto);
  }

  // --- ADMIN ROUTES ---
  @Put('admin/site-settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateSettings(@Body() dto: UpdateSiteSettingDto) {
    return this.cms.updateSettings(dto);
  }

  @Get('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listPages() {
    return this.cms.listPages();
  }

  @Get('admin/pages/:page')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminPage(@Param('page') page: string) {
    return this.cms.getPage(page);
  }

  @Put('admin/pages/:page')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updatePage(@Param('page') page: string, @Body() dto: UpdatePageContentDto) {
    return this.cms.updatePage(page, dto);
  }
}
