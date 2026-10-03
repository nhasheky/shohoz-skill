import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BlockedService } from './blocked.service.js';
import { CreateBlockedDto } from './dto/blocked.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('admin/blocked')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class BlockedController {
  constructor(private readonly blocked: BlockedService) {}

  @Get()
  list() {
    return this.blocked.list();
  }

  @Post()
  add(@Body() dto: CreateBlockedDto) {
    return this.blocked.add(dto.type, dto.value, dto.reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blocked.remove(id);
  }
}
