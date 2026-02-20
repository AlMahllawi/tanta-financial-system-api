import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly perPage?: number = 10;
}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;
  @ApiProperty()
  lastPage: number;
  @ApiProperty()
  currentPage: number;
  @ApiProperty()
  perPage: number;
  @ApiProperty({ type: Number, nullable: true })
  prev: number | null;
  @ApiProperty({ type: Number, nullable: true })
  next: number | null;
}

export class PaginatedDto<TData> {
  @ApiProperty()
  pagination: PaginationMetaDto;

  @ApiProperty({ isArray: true })
  data: TData[];
}
