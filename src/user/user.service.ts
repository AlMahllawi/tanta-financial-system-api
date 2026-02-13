import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { hash } from 'argon2';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          departmentName: createUserDto.departmentName,
          hashedPassword: await hash(createUserDto.password),
          role: createUserDto.role ?? UserRole.USER,
        },
      });

      return plainToInstance(User, user);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2002' &&
        (error.meta?.target as string[]).includes('name')
      )
        throw new ConflictException({
          message: {
            key: ErrorCode.USER_ALREADY_EXISTS,
            args: { name: createUserDto.name },
          },
          statusCode: 409,
          error: 'Conflict',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('departmentName')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.DEPARTMENT_NOT_FOUND,
            args: { departmentName: createUserDto.departmentName },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  // TODO: paginate
  async findAll() {
    const users = await this.prisma.user.findMany();

    return plainToInstance(User, users);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user)
      throw new NotFoundException({
        message: { key: ErrorCode.USER_NOT_FOUND, args: { id } },
        statusCode: 404,
        error: 'Not Found',
      });

    return plainToInstance(User, user);
  }

  async findUserForAuth(name: string) {
    const user = await this.prisma.user.findUnique({
      where: { name },
    });

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...data } = updateUserDto;
    const updateData = {
      ...data,
      ...(password && { hashedPassword: await hash(password) }),
    };

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return plainToInstance(User, user);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2002' &&
        (error.meta?.target as string[]).includes('name')
      )
        throw new ConflictException({
          message: {
            key: ErrorCode.USER_ALREADY_EXISTS,
            args: { name: updateUserDto.name },
          },
          statusCode: 409,
          error: 'Conflict',
        });
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.USER_NOT_FOUND, args: { id } },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('departmentName')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.DEPARTMENT_NOT_FOUND,
            args: { departmentName: updateUserDto.departmentName },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });

      return plainToInstance(User, user);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.USER_NOT_FOUND, args: { id } },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }
}
