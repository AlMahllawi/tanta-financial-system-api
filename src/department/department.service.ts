import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { instanceToInstance } from 'class-transformer';

const dummyDepartment = new Department();
dummyDepartment.name = 'Computer Science';
dummyDepartment.managerName = 'AlMahllawi';

@Injectable()
export class DepartmentService {
  create(createDepartmentDto: CreateDepartmentDto) {
    dummyDepartment.name = createDepartmentDto.name;
    dummyDepartment.managerName = createDepartmentDto.managerName;
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
    dummyDepartment.managerName =
      updateDepartmentDto.managerName ?? 'AlMahllawi';
    return dummyDepartment;
  }

  remove(name: string) {
    dummyDepartment.name = name;
    return dummyDepartment;
  }
}
