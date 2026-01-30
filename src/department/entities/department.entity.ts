import { DepartmentModel } from 'prisma/generated/models';

export class Department implements DepartmentModel {
  name: string;
  managerName: string;
}
