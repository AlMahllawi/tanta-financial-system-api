import { ApiProperty } from '@nestjs/swagger';
import { UserGroups } from 'prisma/generated/enums';

export class ViewUserDto {
  name: string;
  @ApiProperty({ enum: UserGroups })
  role: UserGroups;
  createdAt: Date;
  updatedAt: Date;
}
