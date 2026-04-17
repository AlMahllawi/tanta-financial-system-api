import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionPriority } from '../../../prisma/generated/enums.js';
import { IsName } from '../../common/decorators/is-name.js';

export class CreateTransactionDto {
  @ApiProperty()
  @IsName()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsName()
  typeName: string;

  @ApiPropertyOptional({
    enum: TransactionPriority,
    default: TransactionPriority.LOW,
  })
  @IsOptional()
  @IsEnum(TransactionPriority)
  priority: TransactionPriority = TransactionPriority.LOW;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  documentsIds?: number[];
}
