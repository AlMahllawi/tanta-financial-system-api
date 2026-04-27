import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';
import { plainToInstance } from 'class-transformer';

import { Prisma } from '../../prisma/generated/client.js';
import { UserRole } from '../../prisma/generated/enums.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        departmentName: createUserDto.departmentName,
        hashedPassword: await hash(createUserDto.password),
        role: createUserDto.role ?? UserRole.USER,
      },
    });

    return plainToInstance(User, user);
  }

  async findAll(queryDto: UserQueryDto) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    const where: Prisma.UserWhereInput = { active: true };
    if (queryDto.name)
      where.name = { contains: queryDto.name, mode: 'insensitive' };

    if (queryDto.department)
      where.departmentName = {
        contains: queryDto.department,
        mode: 'insensitive',
      };

    if (queryDto.role) where.role = queryDto.role;

    if (queryDto.active !== undefined) where.active = queryDto.active;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResult(
      plainToInstance(User, users),
      total,
      page,
      perPage,
    );
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
    });

    return plainToInstance(User, user);
  }

  async findUserForAuth(name: string) {
    const user = await this.prisma.user.findUnique({
      where: { name },
      select: { id: true, hashedPassword: true },
    });

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...data } = updateUserDto;
    const updateData = {
      ...data,
      ...(password && { hashedPassword: await hash(password) }),
    };

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return plainToInstance(User, user);
  }

  async remove(id: number) {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    return plainToInstance(User, user);
  }

  async updateLastLogin(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });

    return plainToInstance(User, user);
  }
}
