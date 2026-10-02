import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service.js';
import { InitUploadDto, CompleteUploadDto } from './dto/upload.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

type Chunk = { buffer?: Buffer };

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('init')
  init(@Body() _dto: InitUploadDto) {
    return this.uploads.init();
  }

  @Post(':id/part')
  @UseInterceptors(FileInterceptor('chunk'))
  part(@Param('id') id: string, @UploadedFile() file: Chunk) {
    if (!file?.buffer?.length) throw new BadRequestException('Empty chunk.');
    return this.uploads.append(id, file.buffer);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteUploadDto) {
    return this.uploads.complete(id, dto.ext);
  }
}
