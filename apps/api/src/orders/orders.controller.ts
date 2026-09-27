import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { Request } from 'express';

type Authed = Request & { user: { sub: string; role: string } };

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('mine')
  mine(@Req() req: Authed) {
    return this.orders.mine(req.user.sub);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query('page') page?: string, @Query('perPage') perPage?: string, @Query('status') status?: string) {
    return this.orders.findAll(Number(page) || 1, Number(perPage) || 20, status);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Post()
  create(@Req() req: Authed, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.sub, dto);
  }

  @Post(':id/poll')
  poll(@Req() req: Authed, @Param('id') id: string) {
    return this.orders.poll(id, req.user.sub);
  }

  @Post(':id/refund')
  refund(@Req() req: Authed, @Param('id') id: string) {
    return this.orders.refund(id, req.user.sub);
  }

  @Put(':id/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  setStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.setStatus(id, dto);
  }
}
