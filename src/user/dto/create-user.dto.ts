import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsStrongPassword } from 'class-validator';

import { UserRole } from '../../../prisma/generated/enums.js';
import { IsName } from '../../common/decorators/is-name.js';

export class CreateUserDto {
  @ApiProperty()
  @IsName()
  name: string;

  @ApiProperty()
  @IsName()
  departmentName: string;

  @ApiProperty({ format: 'password' })
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole = UserRole.USER;
}
