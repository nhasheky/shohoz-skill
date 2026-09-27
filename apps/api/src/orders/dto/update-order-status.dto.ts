import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}
