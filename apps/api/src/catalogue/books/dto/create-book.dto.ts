import { Prisma } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  titleBn?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsInt()
  @Min(1)
  pages: number;

  @IsString()
  edition: string;

  @IsOptional()
  @IsString()
  language?: string; // En | Bn | Mixture

  @IsString()
  publisher: string;

  // Leave empty to hide the online PDF option for this book.
  @IsOptional()
  @IsInt()
  @Min(0)
  pdfPrice?: number;

  // Leave empty to hide the printed hardcopy option for this book.
  @IsOptional()
  @IsInt()
  @Min(0)
  hardcopyPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  samplePages?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  students?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedPaymentMethods?: string[];

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  demoPdfUrl?: string;

  // Full book PDF (data URL or link). Served only to owners via the reader.
  @IsOptional()
  @IsString()
  pdfFileUrl?: string;

  @IsOptional()
  seo?: Prisma.InputJsonValue;

  @IsOptional()
  suggested?: Prisma.InputJsonValue; // [{ type, id }]
}
