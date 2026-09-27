import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export type ProductType = 'course' | 'book' | 'exam';

export class CreateOrderDto {
  @IsEnum(['course', 'book', 'exam'])
  productType: ProductType;

  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsEnum(['BKASH', 'NAGAD', 'SSC', 'ROCKET'])
  method: 'BKASH' | 'NAGAD' | 'SSC' | 'ROCKET';
}
