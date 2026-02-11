import { ApiProperty } from '@nestjs/swagger';
import { IsName } from '../../common/decorators/is-name.js';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsName()
  name: string;

  @ApiProperty()
  @IsName()
  managerName: string;
}
