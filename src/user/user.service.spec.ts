import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../prisma/generated/enums.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      departmentName: 'Test Department',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should successfully create a user', async () => {
      const createdUser = {
        id: 1,
        ...createUserDto,
        hashedPassword: 'hashedPassword',
        active: true,
        lastLogin: null,
        createdAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      // Verify password was hashed (different from input or just exists)
      const createCallArgs = prismaMock.user.create.mock.calls[0][0];
      expect(createCallArgs.data.hashedPassword).toBeDefined();
      expect(createCallArgs.data.hashedPassword).not.toEqual(
        createUserDto.password,
      );

      expect(result).toBeInstanceOf(User);
      expect(result.hashedPassword).toBeUndefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );

      prismaMock.user.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if department not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'departmentName' },
        },
      );

      prismaMock.user.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.user.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        {
          id: 1,
          name: 'Test User',
          departmentName: 'Test Department',
          hashedPassword: 'hashedPassword',
          active: true,
          lastLogin: null,
          role: UserRole.USER,
          createdAt: new Date(),
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[0].hashedPassword).toBeUndefined();
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.user.findMany.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a user if found', async () => {
      const user = {
        id,
        name: 'Test User',
        departmentName: 'Test Department',
        hashedPassword: 'hashedPassword',
        active: true,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(id);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeInstanceOf(User);
      expect(result.hashedPassword).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.user.findUnique.mockRejectedValue(error);

      await expect(service.findOne(id)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const id = 1;
    const updateUserDto: UpdateUserDto = {
      name: 'New Name',
      departmentName: 'New Department',
      password: 'New Password',
    };

    it('should successfully update a user', async () => {
      const updatedUser = {
        id,
        name: updateUserDto.name as string,
        departmentName: updateUserDto.departmentName as string,
        hashedPassword: 'newHashedPassword',
        active: true,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(id, updateUserDto);

      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      const updateCallArgs = prismaMock.user.update.mock.calls[0][0];
      expect(updateCallArgs.data.hashedPassword).toBeDefined();
      expect(updateCallArgs.data.hashedPassword).not.toEqual(
        updateUserDto.password,
      );

      expect(result).toBeInstanceOf(User);
      expect(result.hashedPassword).toBeUndefined();
    });

    it('should throw ConflictException on duplicate name', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );

      prismaMock.user.update.mockRejectedValue(error);

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.user.update.mockRejectedValue(error);

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if department not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'departmentName' },
        },
      );

      prismaMock.user.update.mockRejectedValue(error);

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.user.update.mockRejectedValue(error);

      await expect(service.update(id, updateUserDto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a user', async () => {
      const deletedUser = {
        id,
        name: 'Test User',
        departmentName: 'Test Department',
        hashedPassword: 'hashedPassword',
        active: true,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      };

      prismaMock.user.delete.mockResolvedValue(deletedUser);

      const result = await service.remove(id);

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeInstanceOf(User);
      expect(result.hashedPassword).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.user.delete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.user.delete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(error);
    });
  });
});
