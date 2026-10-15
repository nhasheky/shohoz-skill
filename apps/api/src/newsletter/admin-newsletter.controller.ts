import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service.js';
import { BulkSubscribersDto, UpdateSubscriberDto } from './dto/newsletter.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

/** Admin newsletter list — subscribers captured from the storefront footer. */
@Controller('admin/newsletter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminNewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.newsletter.list({ q, status, page: Number(page) || 1, perPage: Number(perPage) || 20 });
  }

  @Get('emails')
  emails(@Query('status') status?: string) {
    return this.newsletter.emails(status || 'SUBSCRIBED');
  }

  @Post('bulk')
  bulk(@Body() dto: BulkSubscribersDto) {
    return this.newsletter.bulk(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriberDto) {
    return this.newsletter.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsletter.remove(id);
  }
}
