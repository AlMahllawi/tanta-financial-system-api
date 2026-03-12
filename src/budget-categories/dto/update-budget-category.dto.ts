import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateBudgetCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  newName: string;
}
