import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionPriority } from '../../../prisma/generated/enums.js';
import { IsName } from '../../common/decorators/is-name.js';

export class CreateTransactionDto {
  @IsName()
  title: string;
  @IsString()
  description: string;
  @IsName()
  typeName: string;
  @ApiPropertyOptional({
    enum: TransactionPriority,
    default: TransactionPriority.LOW,
  })
  @IsOptional()
  @IsEnum(TransactionPriority)
  priority: TransactionPriority = TransactionPriority.LOW;
  documentsIds?: number[];
}
