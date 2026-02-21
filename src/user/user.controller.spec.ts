import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from '../../prisma/generated/enums.js';
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
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = {
        data: [new User()],
        pagination: {
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
          prev: null,
          next: null,
        },
      };
      userService.findAll.mockResolvedValue(result as any);
      await controller.findAll({ page: 1, perPage: 10 });
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return the current user', () => {
      const user = new User();
      expect(controller.getMe(user)).toBe(user);
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a user if found', async () => {
      userService.findOne.mockResolvedValue(new User());
      await controller.findOne(id);
      expect(userService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    const id = 1;
    const updateUserDto: UpdateUserDto = {
      name: 'New Name',
    };

    it('should successfully update a user', async () => {
      userService.update.mockResolvedValue(new User());
      await controller.update(id, updateUserDto, UserRole.ADMIN);
      expect(userService.update).toHaveBeenCalledWith(id, updateUserDto);
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a user', async () => {
      userService.remove.mockResolvedValue(new User());
      await controller.remove(id);
      expect(userService.remove).toHaveBeenCalledWith(id);
    });
  });
});
