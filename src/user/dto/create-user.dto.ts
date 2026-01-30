import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsStrongPassword } from 'class-validator';
import { UserGroups } from 'prisma/generated/enums';
import { IsName } from 'src/common/decorators/is-name';

export class CreateUserDto {
  @IsName()
  name: string;

  @IsName()
  departmentName: string;

  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({ enum: UserGroups, default: UserGroups.USER })
  @IsOptional()
  @IsEnum(UserGroups)
  role: UserGroups = UserGroups.USER;
}
