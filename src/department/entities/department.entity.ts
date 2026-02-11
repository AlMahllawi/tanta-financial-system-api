import { ApiProperty } from '@nestjs/swagger';
import { DepartmentModel } from '../../../prisma/generated/models.js';

export class Department implements DepartmentModel {
  @ApiProperty()
  name: string;

  @ApiProperty()
  managerName: string;
}
