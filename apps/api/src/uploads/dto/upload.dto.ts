import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class InitUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;
}

export class CompleteUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  ext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
