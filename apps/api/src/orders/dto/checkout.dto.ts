import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export type ProductType = 'course' | 'book' | 'exam';
export type PaymentMethod = 'COD' | 'SSLCOMMERZ';
export type DeliveryRegion = 'DHAKA' | 'OUTSIDE';
export type BookVariant = 'pdf' | 'hardcopy';

/**
 * Guest-friendly checkout payload. The server recomputes prices and delivery
 * charges from the database — client-supplied amounts are never trusted.
 */
export class CheckoutDto {
  @IsEnum(['course', 'book', 'exam'])
  productType: ProductType;

  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  duration?: string; // course access plan (e.g. LIFETIME)

  @IsOptional()
  @IsIn(['pdf', 'hardcopy'])
  variant?: BookVariant;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @Matches(/^(\+88)?01\d{9}$/)
  guestPhone?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['DHAKA', 'OUTSIDE'])
  region?: DeliveryRegion;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsIn(['COD', 'SSLCOMMERZ'])
  paymentMethod: PaymentMethod;
}

export class BatchItemDto {
  @IsEnum(['course', 'book', 'exam'])
  productType: ProductType;

  @IsString()
  productId: string;

  @IsOptional()
  @IsIn(['pdf', 'hardcopy'])
  variant?: BookVariant;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

/** Multi-product (cart) checkout — one combined order + single payment. */
export class CheckoutBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @Matches(/^(\+88)?01\d{9}$/)
  guestPhone?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['DHAKA', 'OUTSIDE'])
  region?: DeliveryRegion;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsIn(['COD', 'SSLCOMMERZ'])
  paymentMethod: PaymentMethod;
}
