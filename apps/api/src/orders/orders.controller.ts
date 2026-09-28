import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { Request } from 'express';

type MaybeAuthed = Request & { user?: { sub: string; role: string } };
type Authed = Request & { user: { sub: string; role: string } };

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Public + guest checkout. Uses the JWT when present, otherwise guest fields. */
  @Post('checkout')
  @UseGuards(OptionalJwtAuthGuard)
  checkout(@Req() req: MaybeAuthed, @Body() dto: CheckoutDto) {
    return this.orders.checkout(req.user?.sub ?? null, dto);
  }

  /** Public mock-gateway poll (guest orders have no session). */
  @Post(':id/poll')
  poll(@Param('id') id: string) {
    return this.orders.poll(id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  mine(@Req() req: Authed) {
    return this.orders.mine(req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query('page') page?: string, @Query('perPage') perPage?: string, @Query('status') status?: string) {
    return this.orders.findAll(Number(page) || 1, Number(perPage) || 20, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  create(@Req() req: Authed, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.sub, dto);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  refund(@Req() req: Authed, @Param('id') id: string) {
    return this.orders.refund(id, req.user.sub);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  setStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.setStatus(id, dto);
  }
}
