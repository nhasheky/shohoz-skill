import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { Request } from 'express';

type Authed = Request & { user: { sub: string; role: string } };

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Public: only approved reviews for a product. */
  @Get(':productType/:productId')
  list(@Param('productType') productType: string, @Param('productId') productId: string) {
    return this.reviews.list(productType, productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @Post()
  create(@Req() req: Authed, @Body() dto: CreateReviewDto) {
    return this.reviews.create(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  listAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.reviews.listAll(status ?? 'PENDING', Number(page) || 1, Number(perPage) || 20);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.reviews.approve(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id/reject')
  reject(@Param('id') id: string) {
    return this.reviews.reject(id);
  }
}
