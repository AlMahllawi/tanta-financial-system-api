import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentService {
  create(createDepartmentDto: CreateDepartmentDto) {
    const department = new Department();
    department.name = createDepartmentDto.name;
    department.managerName = createDepartmentDto.managerName;
    return department;
  }

  findAll() {
    const department = new Department();
    department.name = 'Computer Science';
    department.managerName = 'AlMahllawi';
    return [department];
  }

  findOne(name: string) {
    const department = new Department();
    department.name = name;
    department.managerName = 'AlMahllawi';
    return department;
  }

  update(name: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = new Department();
    department.name = name;
    department.managerName = updateDepartmentDto.managerName || 'AlMahllawi';
    return department;
  }
}
