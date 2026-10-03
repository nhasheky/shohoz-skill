import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import { SaveAttemptDto } from './dto/save-attempt.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import type { Request } from 'express';

type Authed = Request & { user: { sub: string; role: string } };

@Controller('exams')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Get()
  findAll() {
    return this.exams.findAll();
  }

  /** Signed-in user saves a finished attempt. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @Post(':id/attempts')
  saveAttempt(@Req() req: Authed, @Param('id') id: string, @Body() dto: SaveAttemptDto) {
    return this.exams.saveAttempt(req.user.sub, id, dto);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.exams.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateExamDto) {
    return this.exams.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.exams.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exams.remove(id);
  }
}
