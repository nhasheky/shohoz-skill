import { Module } from '@nestjs/common';
import { BlockedController } from './blocked.controller.js';
import { BlockedService } from './blocked.service.js';

@Module({
  controllers: [BlockedController],
  providers: [BlockedService],
  exports: [BlockedService],
})
export class BlockedModule {}
