import { IsArray, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}

export class UpdateSubscriberDto {
  @IsOptional()
  @IsIn(['SUBSCRIBED', 'UNSUBSCRIBED'])
  status?: 'SUBSCRIBED' | 'UNSUBSCRIBED';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class BulkSubscribersDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsIn(['DELETE', 'STATUS'])
  action: 'DELETE' | 'STATUS';

  @IsOptional()
  @IsIn(['SUBSCRIBED', 'UNSUBSCRIBED'])
  status?: 'SUBSCRIBED' | 'UNSUBSCRIBED';
}
