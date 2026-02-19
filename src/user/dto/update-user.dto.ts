import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';
import { UserRole } from 'prisma/generated/enums.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  role?: UserRole;
}
