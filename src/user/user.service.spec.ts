import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UserPresence, UserRole } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

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
        presence: UserPresence.OFFLINE,
        lastLogin: null,
        createdAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(createdUser);

      await service.create(createUserDto);

      expect(prismaMock.user['create']).toHaveBeenCalledTimes(1);
      // Verify password was hashed (different from input or just exists)
      const createCallArgs = prismaMock.user.create.mock.calls[0][0];
      expect(createCallArgs.data['hashedPassword']).toBeDefined();
      expect(createCallArgs.data['hashedPassword']).not.toEqual(
        createUserDto.password,
      );
    });
  });

  describe('findAll', () => {
    const users = [
      {
        id: 1,
        name: 'Test User',
        departmentName: 'Test Department',
        hashedPassword: 'hashedPassword',
        active: true,
        presence: UserPresence.OFFLINE,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      },
    ];

    it('should return an array of users', async () => {
      prismaMock.user.findMany.mockResolvedValue(users);
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.$transaction.mockResolvedValue([users, 1]);

      await service.findAll({ page: 1, perPage: 10 });

      expect(prismaMock.user['findMany']).toHaveBeenCalled();
    });

    it('should filter users by specific properties', async () => {
      prismaMock.user.findMany.mockResolvedValue(users);
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.$transaction.mockResolvedValue([users, 1]);

      await service.findAll({
        page: 1,
        perPage: 10,
        name: 'test name',
        department: 'test dept',
        role: UserRole.USER,
        active: true,
      });

      expect(prismaMock.user['findMany']).toHaveBeenCalledWith({
        where: {
          name: { contains: 'test name', mode: 'insensitive' },
          departmentName: { contains: 'test dept', mode: 'insensitive' },
          role: UserRole.USER,
          active: true,
        },
        skip: 0,
        take: 10,
      });
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
        presence: UserPresence.OFFLINE,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      };

      prismaMock.user.findUniqueOrThrow.mockResolvedValue(user);

      await service.findOne(id);

      expect(prismaMock.user['findUniqueOrThrow']).toHaveBeenCalledWith({
        where: { id },
      });
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
        presence: UserPresence.OFFLINE,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      await service.update(id, updateUserDto);

      expect(prismaMock.user['update']).toHaveBeenCalledTimes(1);
      const updateCallArgs = prismaMock.user.update.mock.calls[0][0];
      expect(updateCallArgs.data['hashedPassword']).toBeDefined();
      expect(updateCallArgs.data['hashedPassword']).not.toEqual(
        updateUserDto.password,
      );
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
        presence: UserPresence.OFFLINE,
        lastLogin: null,
        role: UserRole.USER,
        createdAt: new Date(),
      };

      prismaMock.user.delete.mockResolvedValue(deletedUser);

      await service.remove(id);

      expect(prismaMock.user['delete']).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
