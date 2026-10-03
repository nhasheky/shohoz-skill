import { Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

@Controller('admin/re-exam-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminReExamController {
  constructor(private readonly exams: ExamsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.exams.listReExamRequests(status ?? 'PENDING');
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.exams.decideReExam(id, true);
  }

  @Put(':id/reject')
  reject(@Param('id') id: string) {
    return this.exams.decideReExam(id, false);
  }
}
