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

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  answerIndex: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ExamTopicDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  questionsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  marksPerQuestion?: number;

  @IsOptional()
  @IsNumber()
  negativeMarks?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}

export class ExamSubjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamTopicDto)
  topics?: ExamTopicDto[];
}

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

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

  @IsOptional()
  @IsString()
  examType?: string; // package | subject | topic

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceOriginalAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  questionsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalMarks?: number;

  @IsOptional()
  @IsBoolean()
  negativeMarking?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultNegativeMarks?: number;

  @IsOptional()
  @IsNumber()
  marksPerQuestion?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  attemptCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

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
  seo?: Prisma.InputJsonValue;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamSubjectDto)
  subjects?: ExamSubjectDto[];
}
