import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
import { CreateMarketingPixelDto, UpdateMarketingPixelDto } from './dto/marketing.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller()
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  /** Public: enabled pixels consumed by the Next.js storefront. */
  @Get('marketing/pixels')
  publicPixels() {
    return this.marketing.listEnabled();
  }

  // --- ADMIN ROUTES ---
  @Get('admin/marketing/pixels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  list() {
    return this.marketing.listAll();
  }

  @Post('admin/marketing/pixels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: CreateMarketingPixelDto) {
    return this.marketing.create(dto);
  }

  @Put('admin/marketing/pixels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateMarketingPixelDto) {
    return this.marketing.update(id, dto);
  }

  @Delete('admin/marketing/pixels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.marketing.remove(id);
  }
}
