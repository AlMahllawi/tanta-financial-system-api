import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from './entities/department.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      const department = await this.prisma.department.create({
        data: {
          name: createDepartmentDto.name,
        },
      });

      return plainToInstance(Department, department);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2002' &&
        (error.meta?.target as string[]).includes('name')
      )
        throw new ConflictException({
          message: {
            key: ErrorCode.DEPARTMENT_ALREADY_EXISTS,
            args: { name: createDepartmentDto.name },
          },
          statusCode: 409,
          error: 'Conflict',
        });

      throw error;
    }
  }

  // TODO: paginate
  async findAll() {
    const departments = await this.prisma.department.findMany();

    return plainToInstance(Department, departments);
  }

  async findOne(name: string) {
    const department = await this.prisma.department.findUnique({
      where: { name },
    });

    if (!department)
      throw new NotFoundException({
        message: { key: ErrorCode.DEPARTMENT_NOT_FOUND, args: { name } },
        statusCode: 404,
        error: 'Not Found',
      });

    return plainToInstance(Department, department);
  }

  async update(name: string, updateDepartmentDto: UpdateDepartmentDto) {
    try {
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
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2002') {
        if ((error.meta?.target as string[]).includes('name'))
          throw new ConflictException({
            message: {
              key: ErrorCode.DEPARTMENT_ALREADY_EXISTS,
              args: { name: updateDepartmentDto.name },
            },
            statusCode: 409,
            error: 'Conflict',
          });
        if ((error.meta?.target as string[]).includes('managerId'))
          throw new ConflictException({
            message: {
              key: ErrorCode.MANAGER_ALREADY_MANAGES_DEPARTMENT,
              args: { managerId: updateDepartmentDto.managerId },
            },
            statusCode: 409,
            error: 'Conflict',
          });
      }
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.DEPARTMENT_NOT_FOUND, args: { name } },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('managerId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.MANAGER_NOT_FOUND,
            args: { managerId: updateDepartmentDto.managerId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  async remove(name: string) {
    try {
      const department = await this.prisma.department.delete({
        where: { name },
      });

      return plainToInstance(Department, department);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.DEPARTMENT_NOT_FOUND, args: { name } },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }
}
