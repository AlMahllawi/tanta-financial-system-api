import { UserModel } from 'prisma/generated/models';
import { UserGroups } from 'prisma/generated/enums';
import { ApiProperty } from '@nestjs/swagger';

export class User implements UserModel {
  name: string;
  hashedPassword: string;
  createdAt: Date;
  active: boolean;
  @ApiProperty({ enum: UserGroups })
  role: UserGroups;
  lastLogin: Date | null;
  departmentName: string;
}
