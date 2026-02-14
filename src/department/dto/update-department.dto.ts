import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { CreateDepartmentDto } from './create-department.dto.js';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  managerId?: number;
}
