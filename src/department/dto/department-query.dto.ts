import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class DepartmentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by department name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by manager name' })
  @IsOptional()
  @IsString()
  manager?: string;
}
