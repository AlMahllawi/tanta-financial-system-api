import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { IsName } from '../../common/decorators/is-name.js';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsName()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  managerId?: number;
}
