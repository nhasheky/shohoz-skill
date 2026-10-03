import { IsOptional, IsString } from 'class-validator';

/** Guest checkout form snapshot, saved before the order is submitted. */
export class SaveDraftDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  items?: unknown;

  @IsOptional()
  @IsString()
  note?: string;
}
