import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from './entities/department.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const department = await this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
      },
    });

    return plainToInstance(Department, department);
  }

  // TODO: paginate
  async findAll() {
    const departments = await this.prisma.department.findMany();

    return plainToInstance(Department, departments);
  }

  async findOne(name: string) {
    const department = await this.prisma.department.findUniqueOrThrow({
      where: { name },
    });

    return plainToInstance(Department, department);
  }

  async update(name: string, updateDepartmentDto: UpdateDepartmentDto) {
    if (updateDepartmentDto.managerId) {
      const user = await this.prisma.user.findUnique({
        where: { id: updateDepartmentDto.managerId },
      });

      if (!user) {
        throw new NotFoundException({
          message: {
            key: ErrorCode.MANAGER_NOT_FOUND,
            args: { managerId: updateDepartmentDto.managerId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      }

      if (user.departmentName !== name) {
        throw new ConflictException({
          message: {
            key: ErrorCode.MANAGER_NOT_MEMBER_OF_DEPARTMENT,
            args: {
              managerId: updateDepartmentDto.managerId,
              departmentName: name,
            },
          },
          statusCode: 409,
          error: 'Conflict',
        });
      }
    }

    const department = await this.prisma.department.update({
      where: { name },
      data: updateDepartmentDto,
    });

    return plainToInstance(Department, department);
  }

  async remove(name: string) {
    const department = await this.prisma.department.delete({
      where: { name },
    });

    return plainToInstance(Department, department);
  }
}
