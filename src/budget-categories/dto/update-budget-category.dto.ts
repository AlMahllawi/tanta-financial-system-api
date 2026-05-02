import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBudgetCategoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  newName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  preallocation?: number;
}
