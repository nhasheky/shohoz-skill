import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsEnum(['course', 'book', 'exam'])
  productType: string;

  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  text: string;
}
