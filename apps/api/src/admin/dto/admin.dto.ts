import { IsEnum } from 'class-validator';

export class SetUserStatusDto {
  @IsEnum(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}
