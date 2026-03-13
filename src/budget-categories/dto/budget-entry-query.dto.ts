import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class BudgetEntryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by inputter name' })
  @IsOptional()
  @IsString()
  inputter?: string;

  @ApiPropertyOptional({
    description:
      'Filter entries with amount greater than or equal to this value',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter entries with amount less than or equal to this value',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter entries from this date (inclusive)',
    type: String,
    example: '2026-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter entries up to this date (inclusive)',
    type: String,
    example: '2026-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
