import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { hash } from 'argon2';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

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

  async findAll(paginationDto: PaginationDto) {
    const { skip, take, page, perPage } = createPaginator(paginationDto);

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
      }),
      this.prisma.user.count(),
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
