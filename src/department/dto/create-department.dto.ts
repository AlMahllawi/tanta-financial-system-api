import { IsName } from 'src/common/decorators';

export class CreateDepartmentDto {
  @IsName()
  name: string;
  @IsName()
  managerName: string;
}
