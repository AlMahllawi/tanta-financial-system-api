import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UserRole } from '../../prisma/generated/enums.js';
import { User } from '../user/entities/user.entity.js';
import { AuthService } from './auth.service.js';
import { JwtPayload } from './interfaces/auth.interface.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authServiceMock: DeepMockProxy<AuthService>;
  let configServiceMock: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    authServiceMock = mockDeep<AuthService>();
    configServiceMock = mockDeep<ConfigService>();

    configServiceMock.getOrThrow.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: authServiceMock,
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
      authServiceMock.validateJwtPayload.mockResolvedValue(user);
      const result = await strategy.validate(payload);
      expect(authServiceMock['validateJwtPayload']).toHaveBeenCalledWith(
        payload,
      );
      expect(result).toEqual(user);
    });

    it('should throw if validation fails', async () => {
      authServiceMock.validateJwtPayload.mockRejectedValue(new Error('error'));
      await expect(strategy.validate(payload)).rejects.toThrow();
    });
  });
});
