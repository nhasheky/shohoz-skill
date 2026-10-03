import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';

export class CoursePriceDto {
  @IsString()
  @IsNotEmpty()
  duration: string; // LIFETIME | 1_MONTH | 2_MONTHS | 3_MONTHS | 6_MONTHS

  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  originalAmount?: number;
}

export class LessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  sourceKind?: string; // youtube | direct

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsBoolean()
  preview?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CurriculumSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons?: LessonDto[];
}

export class CreateCourseDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  titleBn?: string;

  @IsString()
  @IsNotEmpty()
  tagline: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsString()
  categoryBn?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  durationLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lectures?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quizzes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  articles?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  resources?: number;

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
  certificate?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  seo?: Prisma.InputJsonValue;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningOutcomes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whoIsFor?: string[];

  @IsOptional()
  faq?: Prisma.InputJsonValue;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedPaymentMethods?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoursePriceDto)
  prices?: CoursePriceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumSectionDto)
  curriculum?: CurriculumSectionDto[];

  @IsOptional()
  suggested?: Prisma.InputJsonValue; // [{ type, id }]
}
