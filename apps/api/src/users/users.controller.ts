import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { Request } from 'express';

type Authed = Request & { user: { sub: string; role: string } };

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: Authed) {
    return this.users.me(req.user.sub);
  }

  @Get('me/enrollments')
  enrollments(@Req() req: Authed) {
    return this.users.myEnrollments(req.user.sub);
  }

  @Get('me/orders')
  orders(@Req() req: Authed) {
    return this.users.myOrders(req.user.sub);
  }

  @Get('me/progress')
  progress(@Req() req: Authed) {
    return this.users.myProgress(req.user.sub);
  }

  @Get('me/attempts')
  attempts(@Req() req: Authed) {
    return this.users.myAttempts(req.user.sub);
  }

  @Get('me/course-progress/:courseId')
  courseProgress(@Req() req: Authed, @Param('courseId') courseId: string) {
    return this.users.courseProgress(req.user.sub, courseId);
  }

  @Post('me/course-progress')
  setLessonProgress(
    @Req() req: Authed,
    @Body() body: { courseId: string; lessonId: string; completed?: boolean },
  ) {
    if (!body?.courseId || !body?.lessonId) throw new BadRequestException('courseId and lessonId required.');
    return this.users.setLessonProgress(req.user.sub, body.courseId, body.lessonId, Boolean(body.completed));
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.users.findAll(q, Number(page) || 1, Number(perPage) || 20);
  }

  @Get(':id/overview')
  @Roles('ADMIN', 'SUPER_ADMIN')
  overview(@Param('id') id: string) {
    return this.users.adminOverview(id);
  }

  /** Admin: manually grant a course/book/exam to a user. */
  @Post(':id/enrollments')
  @Roles('ADMIN', 'SUPER_ADMIN')
  grantEnrollment(@Param('id') id: string, @Body() body: { productType: string; productId: string }) {
    if (!body?.productType || !body?.productId) throw new BadRequestException('productType and productId required.');
    return this.users.grantEnrollmentAdmin(id, body.productType, body.productId);
  }

  @Delete(':id/enrollments/:enrollmentId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  revokeEnrollment(@Param('id') id: string, @Param('enrollmentId') enrollmentId: string) {
    return this.users.revokeEnrollment(id, enrollmentId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
