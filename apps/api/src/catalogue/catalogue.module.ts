import { Module } from '@nestjs/common';
import { CoursesController } from './courses/courses.controller.js';
import { CoursesService } from './courses/courses.service.js';
import { BooksService } from './books/books.service.js';
import { BooksController } from './books/books.controller.js';
import { ExamsService } from './exams/exams.service.js';
import { ExamsController } from './exams/exams.controller.js';

@Module({
  controllers: [CoursesController, BooksController, ExamsController],
  providers: [CoursesService, BooksService, ExamsService],
  exports: [CoursesService, BooksService, ExamsService],
})
export class CatalogueModule {}
