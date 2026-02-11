import { DepartmentModel } from '../../../prisma/generated/models.js';

export class Department implements DepartmentModel {
  name: string;
  managerName: string;
}
