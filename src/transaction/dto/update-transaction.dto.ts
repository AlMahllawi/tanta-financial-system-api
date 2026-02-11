import { PartialType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @IsOptional()
  @IsBoolean()
  fulfilled?: boolean;
}
