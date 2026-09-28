import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller.js';
import { AdminCmsController } from './admin-cms.controller.js';
import { CmsService } from './cms.service.js';

@Module({
  controllers: [CmsController, AdminCmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
