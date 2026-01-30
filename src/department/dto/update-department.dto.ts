import { OmitType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';

export class UpdateDepartmentDto extends OmitType(CreateDepartmentDto, [
  'name',
] as const) {}
