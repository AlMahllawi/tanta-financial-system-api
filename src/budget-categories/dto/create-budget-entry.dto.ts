import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBudgetEntryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
