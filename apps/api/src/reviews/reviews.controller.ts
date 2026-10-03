import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { Request } from 'express';

type Authed = Request & { user: { sub: string; role: string } };

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** The signed-in user's own reviews (any status). */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@Req() req: Authed) {
    return this.reviews.mine(req.user.sub);
  }

  /** Public: only approved reviews for a product. */
  @Get(':productType/:productId')
  list(@Param('productType') productType: string, @Param('productId') productId: string) {
    return this.reviews.list(productType, productId);
  }

  /** Any signed-in user may review — no purchase required. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @Post()
  create(@Req() req: Authed, @Body() dto: CreateReviewDto) {
    return this.reviews.create(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @Put(':id')
  update(@Req() req: Authed, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(req.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @Delete(':id')
  remove(@Req() req: Authed, @Param('id') id: string) {
    return this.reviews.remove(req.user.sub, id);
  }
}
