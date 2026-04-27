import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { CreateTransactionDto } from './create-transaction.dto.js';

export class UpdateTransactionDto extends PartialType(
  OmitType(CreateTransactionDto, ['documentsIds'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fulfilled?: boolean;

  @ApiPropertyOptional({
    description: 'Can only be updated by admin and accountant.',
  })
  @IsOptional()
  @IsString()
  budgetName?: string;

  @ApiPropertyOptional({
    description: 'Can only be updated by admin and accountant.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAllocation?: number;
}
