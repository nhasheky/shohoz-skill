import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlockedDto {
  @IsIn(['PHONE', 'IP'])
  type: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
