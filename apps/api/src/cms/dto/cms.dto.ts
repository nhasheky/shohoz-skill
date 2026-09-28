import { Prisma } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSiteSettingDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  siteTitle?: string;

  @IsOptional()
  @IsString()
  siteTitleBn?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  socials?: Prisma.InputJsonValue;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryChargeDhaka?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryChargeOutside?: number;

  @IsOptional()
  @IsBoolean()
  codEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sslcommerzEnabled?: boolean;
}

export class UpdatePageContentDto {
  @IsOptional()
  data?: Prisma.InputJsonValue;
}

export class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @MinLength(1)
  message: string;
}

export class UpdateContactMessageStatusDto {
  @IsIn(['NEW', 'READ', 'REPLIED', 'ARCHIVED'])
  status: 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';
}
