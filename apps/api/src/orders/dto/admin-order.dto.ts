import { IsArray, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;

export class UpdateOrderAdminDto {
  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  productTitle?: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryCharge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['DHAKA', 'OUTSIDE'])
  region?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  txId?: string;
}

export class BulkOrderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsIn(['DELETE', 'STATUS'])
  action: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: string;
}
