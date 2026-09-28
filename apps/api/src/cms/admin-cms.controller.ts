import { Body, Controller, Delete, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateContactMessageStatusDto, UpdatePageContentDto, UpdateSiteSettingDto } from './dto/cms.dto.js';

/** Admin CMS management — settings, editable pages and contact messages. */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminCmsController {
  constructor(private readonly cms: CmsService) {}

  @Get('site-settings')
  getSettings() {
    return this.cms.getSettings();
  }

  @Put('site-settings')
  updateSettings(@Body() dto: UpdateSiteSettingDto) {
    return this.cms.updateSettings(dto);
  }

  @Get('pages')
  listPages() {
    return this.cms.listPages();
  }

  @Get('pages/:page')
  getPage(@Param('page') page: string) {
    return this.cms.getPage(page);
  }

  @Put('pages/:page')
  updatePage(@Param('page') page: string, @Body() dto: UpdatePageContentDto) {
    return this.cms.updatePage(page, dto);
  }

  @Get('contact-messages')
  listMessages(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.cms.listMessages(status, Number(page) || 1, Number(perPage) || 20);
  }

  @Patch('contact-messages/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContactMessageStatusDto) {
    return this.cms.updateMessageStatus(id, dto);
  }

  @Delete('contact-messages/:id')
  removeMessage(@Param('id') id: string) {
    return this.cms.deleteMessage(id);
  }
}
