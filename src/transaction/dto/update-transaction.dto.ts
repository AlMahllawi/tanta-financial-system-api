import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fulfilled?: boolean;
}
