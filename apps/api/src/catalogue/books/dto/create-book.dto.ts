import { Prisma } from '@prisma/client';
import {
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
  @IsString()
  @IsNotEmpty()
  slug: string;

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

  @IsInt()
  @Min(0)
  pdfPrice: number;

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
  seo?: Prisma.InputJsonValue;
}
