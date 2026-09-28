import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CmsService } from './cms.service.js';
import { CreateContactMessageDto } from './dto/cms.dto.js';

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
}
