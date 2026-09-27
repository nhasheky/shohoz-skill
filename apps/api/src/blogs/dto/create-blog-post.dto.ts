import { Prisma } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsString()
  categoryBn?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readMinutes?: number;

  /** BlogBlock[] — { type: paragraph|heading|list|quote|image|video|gallery, ... } */
  @IsOptional()
  @IsArray()
  content?: Record<string, unknown>[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  seo?: Prisma.InputJsonValue;
}
