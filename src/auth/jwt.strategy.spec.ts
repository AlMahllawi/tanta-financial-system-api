import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy.js';
import { UserService } from '../user/user.service.js';
import { ConfigService } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { JwtPayload } from './interfaces/auth.interface.js';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../user/entities/user.entity.js';
import { plainToInstance } from 'class-transformer';
import { UserRole } from '../../prisma/generated/enums.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userServiceMock: DeepMockProxy<UserService>;
  let configServiceMock: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    userServiceMock = mockDeep<UserService>();
    configServiceMock = mockDeep<ConfigService>();

    configServiceMock.getOrThrow.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload: JwtPayload = { id: 1 };
    const user = plainToInstance(User, {
      id: 1,
      name: 'testuser',
      role: UserRole.USER,
      departmentName: 'Test Dept',
      active: true,
    });

    it('should return user if active and found', async () => {
      userServiceMock.findOne.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(userServiceMock.findOne).toHaveBeenCalledWith(payload.id);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = plainToInstance(User, { ...user, active: false });
      userServiceMock.findOne.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userServiceMock.findOne.mockRejectedValue(new Error('User not found'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
