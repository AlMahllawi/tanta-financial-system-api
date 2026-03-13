import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from './entities/department.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { DepartmentQueryDto } from './dto/department-query.dto.js';
import { Prisma } from '../../prisma/generated/client.js';

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

  async findAll(queryDto: DepartmentQueryDto) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    const where: Prisma.DepartmentWhereInput = {};
    if (queryDto.name)
      where.name = { contains: queryDto.name, mode: 'insensitive' };

    if (queryDto.manager)
      where.manager = {
        name: { contains: queryDto.manager, mode: 'insensitive' },
      };

    const [departments, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        skip,
        take,
      }),
      this.prisma.department.count({ where }),
    ]);

    return createPaginatedResult(
      plainToInstance(Department, departments),
      total,
      page,
      perPage,
    );
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

      if (!user)
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.MANAGER_NOT_FOUND,
          { managerId: updateDepartmentDto.managerId },
        );

      if (user.departmentName !== name)
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.MANAGER_NOT_MEMBER_OF_DEPARTMENT,
          {
            managerId: updateDepartmentDto.managerId,
            departmentName: name,
          },
        );
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
