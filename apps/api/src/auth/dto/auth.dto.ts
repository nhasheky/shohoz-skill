import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

/* ──────── existing OTP DTOs (kept for backward compat) ──────── */

export class RequestOtpDto {
  @IsString()
  @Matches(/^(\+88)?01\d{9}$/, { message: 'Phone must be a valid Bangladeshi number.' })
  phone: string;

  @IsOptional()
  @IsString()
  purpose?: 'LOGIN' | 'REGISTER' | 'RESET';

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^(\+88)?01\d{9}$/)
  phone: string;

  @IsString()
  @MinLength(4)
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

/* ──────── NEW: email + password DTOs ──────── */

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^(\+88)?01\d{9}$/, { message: 'Phone must be a valid Bangladeshi number.' })
  phone: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;
}

export class LoginDto {
  @IsString()
  identifier: string; // email or phone

  @IsString()
  @MinLength(1)
  password: string;
}
