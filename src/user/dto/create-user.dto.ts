import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsStrongPassword } from 'class-validator';
import { UserGroups } from 'prisma/generated/enums';
import { IsName } from 'src/common/decorators/is-name';

export class CreateUserDto {
  @IsName()
  name: string;

  @IsStrongPassword()
  password: string;

  @ApiProperty({ enum: UserGroups })
  @IsOptional()
  @IsEnum(UserGroups)
  group?: UserGroups = UserGroups.USER;
}
