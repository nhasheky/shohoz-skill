import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { CatalogueModule } from './catalogue/catalogue.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { BlogsModule } from './blogs/blogs.module.js';
import { AdminModule } from './admin/admin.module.js';
import { CmsModule } from './cms/cms.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { BlockedModule } from './blocked/blocked.module.js';
import { MarketingModule } from './marketing/marketing.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogueModule,
    OrdersModule,
    ReviewsModule,
    BlogsModule,
    AdminModule,
    CmsModule,
    UploadsModule,
    CouponsModule,
    BlockedModule,
    MarketingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
