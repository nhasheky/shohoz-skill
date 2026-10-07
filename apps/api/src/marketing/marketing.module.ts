import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';
import { MetaCapiService } from './meta-capi.service.js';

@Module({
  controllers: [MarketingController],
  providers: [MarketingService, MetaCapiService],
  exports: [MarketingService, MetaCapiService],
})
export class MarketingModule {}
