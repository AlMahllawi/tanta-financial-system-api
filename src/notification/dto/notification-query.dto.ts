import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class NotificationQueryDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Filter notifications created on or after this date',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Filter notifications created on or before this date',
  })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by title or description',
  })
  search?: string;
}
