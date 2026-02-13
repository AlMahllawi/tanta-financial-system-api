import { UserModel } from '../../../prisma/generated/models.js';
import { UserRole } from '../../../prisma/generated/enums.js';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class User implements UserModel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @Exclude()
  @ApiHideProperty()
  hashedPassword: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ nullable: true })
  lastLogin: Date | null;

  @ApiProperty()
  departmentName: string;
}
