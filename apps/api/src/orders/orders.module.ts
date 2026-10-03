import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { SteadfastService } from './steadfast.service.js';
import { CouponsModule } from '../coupons/coupons.module.js';

@Module({
  imports: [CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService, SteadfastService],
  exports: [OrdersService],
})
export class OrdersModule {}
