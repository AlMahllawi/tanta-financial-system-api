import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  create(createDepartmentDto: CreateDepartmentDto) {
    return `This action adds a new department with name "${createDepartmentDto.name}" managed by "${createDepartmentDto.managerName}"`;
  }

  findAll() {
    return `This action returns all departments`;
  }

  findOne(name: string) {
    return `This action returns the department with name "${name}"`;
  }

  update(name: string, updateDepartmentDto: UpdateDepartmentDto) {
    return `This action updates the department "${name}"`;
  }

  remove(name: string) {
    return `This action removes the department "${name}"`;
  }
}
