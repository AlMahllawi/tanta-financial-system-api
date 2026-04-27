import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UserRole } from '../../prisma/generated/enums.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { User } from '../user/entities/user.entity.js';
import { UserService } from '../user/user.service.js';
import { JwtPayload } from './interfaces/auth.interface.js';
import { JwtStrategy } from './jwt.strategy.js';

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

      expect(userServiceMock['findOne']).toHaveBeenCalledWith(payload.id);
      expect(result).toEqual(user);
    });

    it('should throw ApiException if user is inactive', async () => {
      const inactiveUser = plainToInstance(User, { ...user, active: false });
      userServiceMock.findOne.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(payload)).rejects.toThrow(ApiException);
    });

    it('should throw ApiException if user not found', async () => {
      userServiceMock.findOne.mockRejectedValue(new Error('User not found'));

      await expect(strategy.validate(payload)).rejects.toThrow(ApiException);
    });
  });
});
