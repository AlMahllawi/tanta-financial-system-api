import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../prisma/generated/enums.js';

export class ViewUserDto {
  name: string;
  @ApiProperty({ enum: UserRole })
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
