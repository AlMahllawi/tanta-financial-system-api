import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { hash } from 'argon2';

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

  // TODO: paginate
  async findAll() {
    const users = await this.prisma.user.findMany();

    return plainToInstance(User, users);
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
