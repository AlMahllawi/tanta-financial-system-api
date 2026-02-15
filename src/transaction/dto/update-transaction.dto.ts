import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTransactionDto extends PartialType(
  OmitType(CreateTransactionDto, ['documentsIds'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fulfilled?: boolean;
}
