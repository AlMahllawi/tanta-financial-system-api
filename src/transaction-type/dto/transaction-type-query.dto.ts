import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class TransactionTypeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  creatorId?: number;
}
