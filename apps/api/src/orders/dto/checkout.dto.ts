import { IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

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

  @IsIn(['COD', 'SSLCOMMERZ'])
  paymentMethod: PaymentMethod;
}
