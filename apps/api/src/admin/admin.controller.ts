import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SetUserStatusDto } from './dto/admin.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.admin.users(q, Number(page) || 1, Number(perPage) || 20);
  }

  @Patch('users/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: SetUserStatusDto) {
    return this.admin.setUserStatus(id, dto.status);
  }

  @Get('orders')
  orders(@Query('page') page?: string, @Query('perPage') perPage?: string, @Query('status') status?: string) {
    return this.admin.orders(Number(page) || 1, Number(perPage) || 20, status);
  }

  @Patch('reviews/:id/moderate')
  moderate(@Param('id') id: string, @Body() dto: { status: 'APPROVED' | 'REJECTED' }) {
    return this.admin.moderateReview(id, dto.status);
  }

  @Get('analytics/revenue')
  revenue() {
    return this.admin.revenueSeries();
  }

  @Get('courses')
  courses(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.admin.courses(q, Number(page) || 1, Number(perPage) || 20);
  }

  @Get('books')
  books(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.admin.books(q, Number(page) || 1, Number(perPage) || 20);
  }

  @Get('exams')
  exams(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.admin.exams(q, Number(page) || 1, Number(perPage) || 20);
  }

  @Get('blogs')
  blogs(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.admin.blogs(q, Number(page) || 1, Number(perPage) || 20);
  }

  @Get('courses/:id')
  courseById(@Param('id') id: string) {
    return this.admin.courseById(id);
  }

  @Get('books/:id')
  bookById(@Param('id') id: string) {
    return this.admin.bookById(id);
  }

  @Get('exams/:id')
  examById(@Param('id') id: string) {
    return this.admin.examById(id);
  }

  @Get('blogs/:id')
  blogById(@Param('id') id: string) {
    return this.admin.blogById(id);
  }
}
