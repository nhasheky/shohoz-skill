import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NewsletterService } from './newsletter.service.js';
import { SubscribeNewsletterDto } from './dto/newsletter.dto.js';

/** Public newsletter opt-in — used by the storefront footer signup form. */
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post()
  subscribe(@Body() dto: SubscribeNewsletterDto, @Req() req: Request) {
    const fwd = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.ip || '';
    return this.newsletter.subscribe(dto, { ip, userAgent: String(req.headers['user-agent'] ?? '') });
  }
}
