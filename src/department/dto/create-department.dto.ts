import { IsName } from 'src/common/decorators/is-name';

export class CreateDepartmentDto {
  @IsName()
  name: string;
  @IsName()
  managerName: string;
}
