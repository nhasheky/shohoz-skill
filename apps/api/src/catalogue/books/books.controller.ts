import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

type Authed = Request & { user: { sub: string; role: string } };

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll() {
    return this.books.findAll();
  }

  /** Owner-only full PDF for the secure reader. Registered before `:slug`. */
  @UseGuards(JwtAuthGuard)
  @Get(':id/content')
  content(@Param('id') id: string, @Req() req: Authed) {
    return this.books.content(id, req.user.sub);
  }

  /** Public sample PDF opened from the cover. */
  @Get(':id/demo')
  demo(@Param('id') id: string) {
    return this.books.demo(id);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.books.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.books.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.books.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.books.remove(id);
  }
}
