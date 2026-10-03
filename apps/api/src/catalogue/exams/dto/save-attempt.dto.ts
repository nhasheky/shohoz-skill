import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SaveAttemptDto {
  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(0)
  maxMarks: number;

  @IsInt()
  @Min(0)
  correct: number;

  @IsInt()
  @Min(0)
  wrong: number;

  @IsInt()
  @Min(0)
  unanswered: number;

  @IsBoolean()
  passed: boolean;

  @IsOptional()
  answers?: unknown;
}
