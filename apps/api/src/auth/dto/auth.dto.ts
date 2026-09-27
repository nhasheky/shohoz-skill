import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @Matches(/^01\d{9}$/, { message: 'Phone must be 11 digits starting with 01.' })
  phone: string;

  @IsOptional()
  @IsEnum(['LOGIN', 'REGISTER', 'RESET'])
  purpose?: 'LOGIN' | 'REGISTER' | 'RESET';

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^01\d{9}$/)
  phone: string;

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  code: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export type DeviceInfo = {
  deviceName?: string;
  browser?: string;
  os?: string;
  ip?: string;
};

export class RevokeSessionDto {
  @IsString()
  sessionId: string;
}
