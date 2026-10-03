import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { AdminCreateReviewDto, AdminUpdateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  listAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.reviews.listAll(status ?? 'ALL', Number(page) || 1, Number(perPage) || 20);
  }

  @Post()
  create(@Body() dto: AdminCreateReviewDto) {
    return this.reviews.adminCreate(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateReviewDto) {
    return this.reviews.adminUpdate(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviews.adminRemove(id);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.reviews.approve(id);
  }

  @Put(':id/reject')
  reject(@Param('id') id: string) {
    return this.reviews.reject(id);
  }
}
