import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class BudgetCategoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by category name' })
  @IsOptional()
  @IsString()
  name?: string;
}
