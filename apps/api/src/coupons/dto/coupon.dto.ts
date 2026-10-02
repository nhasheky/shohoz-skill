import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['PERCENT', 'FIXED'])
  type: string;

  @IsInt()
  @Min(1)
  value: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotal?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsArray()
  @IsIn(['course', 'book', 'exam'], { each: true })
  appliesTo?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ValidateCouponItemDto {
  @IsIn(['course', 'book', 'exam'])
  productType: string;

  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsArray()
  items: ValidateCouponItemDto[];
}
