import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ApiException } from '../common/exceptions/api.exception.js';
import { LoginDto } from './dto/login.dto.js';
import { UserRole } from '../../prisma/generated/enums.js';
import { User } from '../user/entities/user.entity.js';
import { plainToInstance } from 'class-transformer';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: DeepMockProxy<AuthService>;

  beforeEach(async () => {
    authServiceMock = mockDeep<AuthService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      name: 'testuser',
      password: 'password123',
    };

    const authenticatedUser = plainToInstance(User, {
      id: 1,
      name: 'testuser',
      role: UserRole.USER,
      departmentName: 'Test Dept',
      hashedPassword: 'hashed',
      createdAt: new Date('2026-01-01'),
      active: true,
      lastLogin: null,
    });

    it('should successfully login and return tokens', async () => {
      authServiceMock.validateUser.mockResolvedValue(authenticatedUser.id);
      authServiceMock.login.mockResolvedValue({
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
        user: authenticatedUser,
      });

      await controller.login(loginDto);

      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        loginDto.name,
        loginDto.password,
      );
      expect(authServiceMock.login).toHaveBeenCalledWith(authenticatedUser.id);
    });

    it('should throw ApiException for invalid credentials', async () => {
      authServiceMock.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(ApiException);
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      const refreshUser = plainToInstance(User, {
        id: 1,
        name: 'testuser',
        role: UserRole.USER,
        departmentName: 'Test Dept',
        hashedPassword: 'hashed',
        createdAt: new Date('2026-01-01'),
        active: true,
        lastLogin: null,
      });
      const tokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: refreshUser,
      };
      authServiceMock.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh({
        refreshToken: 'valid-refresh-token',
      });

      expect(authServiceMock.refresh).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(result).toEqual(tokens);
    });
  });
});
