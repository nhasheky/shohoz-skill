import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query('q') q?: string, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.users.findAll(q, Number(page) || 1, Number(perPage) || 20);
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
