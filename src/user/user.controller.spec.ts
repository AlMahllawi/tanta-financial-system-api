import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { User } from './entities/user.entity.js';

describe('UserController', () => {
  let controller: UserController;
  let userService: DeepMockProxy<UserService>;

  beforeEach(async () => {
    userService = mockDeep<UserService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      departmentName: 'Test Department',
      password: 'Password',
      role: UserRole.USER,
    };

    it('should successfully create a user', async () => {
      userService.create.mockResolvedValue(new User());
      await controller.create(createUserDto);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should propagate ConflictException', async () => {
      userService.create.mockRejectedValue(new ConflictException());
      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      userService.findAll.mockResolvedValue([new User()]);
      await controller.findAll();
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const name = 'Test User';

    it('should return a user if found', async () => {
      userService.findOne.mockResolvedValue(new User());
      await controller.findOne(name);
      expect(userService.findOne).toHaveBeenCalledWith(name);
    });

    it('should propagate NotFoundException if user not found', async () => {
      userService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(name)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const name = 'Test User';
    const updateUserDto: UpdateUserDto = {
      name: 'New Name',
    };

    it('should successfully update a user', async () => {
      userService.update.mockResolvedValue(new User());
      await controller.update(name, updateUserDto);
      expect(userService.update).toHaveBeenCalledWith(name, updateUserDto);
    });

    it('should propagate ConflictException', async () => {
      userService.update.mockRejectedValue(new ConflictException());
      await expect(controller.update(name, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate NotFoundException', async () => {
      userService.update.mockRejectedValue(new NotFoundException());
      await expect(controller.update(name, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const name = 'Test User';

    it('should successfully remove a user', async () => {
      userService.remove.mockResolvedValue(new User());
      await controller.remove(name);
      expect(userService.remove).toHaveBeenCalledWith(name);
    });

    it('should propagate NotFoundException', async () => {
      userService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove(name)).rejects.toThrow(NotFoundException);
    });
  });
});
