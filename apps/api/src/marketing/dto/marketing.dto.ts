import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const MARKETING_PROVIDERS = [
  'facebook',
  'tiktok',
  'gtm',
  'ga4',
  'google_ads',
  'snapchat',
  'linkedin',
  'pinterest',
  'twitter',
  'clarity',
  'custom',
] as const;

export class CreateMarketingPixelDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsIn(MARKETING_PROVIDERS as unknown as string[])
  provider?: string;

  @IsOptional()
  @IsString()
  pixelId?: string;

  @IsOptional()
  @IsString()
  headCode?: string;

  @IsOptional()
  @IsString()
  bodyCode?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateMarketingPixelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsIn(MARKETING_PROVIDERS as unknown as string[])
  provider?: string;

  @IsOptional()
  @IsString()
  pixelId?: string;

  @IsOptional()
  @IsString()
  headCode?: string;

  @IsOptional()
  @IsString()
  bodyCode?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
