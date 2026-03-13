import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import {
  TransactionPriority,
  TransactionForwardStatus,
} from '../../../prisma/generated/enums.js';
import { TransactionQuery } from '../enums/transaction-query.enum.js';

export class TransactionQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by predefined query enum',
    enum: TransactionQuery,
  })
  @IsOptional()
  @IsEnum(TransactionQuery)
  query?: TransactionQuery;

  @ApiPropertyOptional({ description: 'Filter by transaction title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction type name' })
  @IsOptional()
  @IsString()
  typeName?: string;

  @ApiPropertyOptional({ description: 'Filter by fulfilled status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as unknown;
  })
  @IsBoolean()
  fulfilled?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by transaction priority',
    enum: TransactionPriority,
  })
  @IsOptional()
  @IsEnum(TransactionPriority)
  priority?: TransactionPriority;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  creatorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by last forward status',
    enum: TransactionForwardStatus,
  })
  @IsOptional()
  @IsEnum(TransactionForwardStatus)
  lastForwardStatus?: TransactionForwardStatus;

  @ApiPropertyOptional({
    description: 'Filter transactions from this date (inclusive)',
    type: String,
    example: '2026-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter transactions up to this date (inclusive)',
    type: String,
    example: '2026-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
