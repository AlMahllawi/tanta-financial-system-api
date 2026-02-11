import { IsName } from '../../common/decorators/is-name.js';

export class CreateDepartmentDto {
  @IsName()
  name: string;
  @IsName()
  managerName: string;
}
