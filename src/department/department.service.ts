import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from './entities/department.entity.js';
import { instanceToInstance } from 'class-transformer';

const dummyDepartment = new Department();
dummyDepartment.name = 'Computer Science';
dummyDepartment.managerId = 1;

@Injectable()
export class DepartmentService {
  create(createDepartmentDto: CreateDepartmentDto) {
    dummyDepartment.name = createDepartmentDto.name;
    dummyDepartment.managerId = createDepartmentDto.managerId ?? null;
    return dummyDepartment;
  }

  findAll() {
    return [dummyDepartment];
  }

  findOne(name: string) {
    const department = instanceToInstance(dummyDepartment);
    department.name = name;
    return department;
  }

  update(name: string, updateDepartmentDto: UpdateDepartmentDto) {
    dummyDepartment.name = updateDepartmentDto.name ?? name;
    dummyDepartment.managerId =
      updateDepartmentDto.managerId ?? dummyDepartment.managerId;
    return dummyDepartment;
  }

  remove(name: string) {
    dummyDepartment.name = name;
    return dummyDepartment;
  }
}
