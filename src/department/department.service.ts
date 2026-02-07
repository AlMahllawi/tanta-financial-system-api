import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

const department = new Department();
department.name = 'Computer Science';
department.managerName = 'AlMahllawi';

@Injectable()
export class DepartmentService {
  create(createDepartmentDto: CreateDepartmentDto) {
    department.name = createDepartmentDto.name;
    department.managerName = createDepartmentDto.managerName;
    return department;
  }

  findAll() {
    return [department];
  }

  findOne(name: string) {
    department.name = name;
    return department;
  }

  update(name: string, updateDepartmentDto: UpdateDepartmentDto) {
    department.name = updateDepartmentDto.name ?? name;
    department.managerName = updateDepartmentDto.managerName ?? 'AlMahllawi';
    return department;
  }

  remove(name: string) {
    department.name = name;
    return department;
  }
}
