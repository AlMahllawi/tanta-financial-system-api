import { UserModel } from '../../../prisma/generated/models.js';
import { UserRole } from '../../../prisma/generated/enums.js';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class User implements UserModel {
  name: string;
  @Exclude()
  @ApiHideProperty()
  hashedPassword: string;
  createdAt: Date;
  active: boolean;
  @ApiProperty({ enum: UserRole })
  role: UserRole;
  lastLogin: Date | null;
  departmentName: string;
}
