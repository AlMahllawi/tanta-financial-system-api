import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { UserRole } from '../../prisma/generated/enums.js';

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

    const authenticatedUser = {
      name: 'testuser',
      role: UserRole.USER,
      departmentName: 'Test Dept',
    };

    it('should successfully login and return tokens', async () => {
      authServiceMock.validateUser.mockResolvedValue(authenticatedUser);
      authServiceMock.login.mockReturnValue({
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
        user: authenticatedUser,
      });

      await controller.login(loginDto);

      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        loginDto.name,
        loginDto.password,
      );
      expect(authServiceMock.login).toHaveBeenCalledWith(authenticatedUser);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authServiceMock.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', () => {
      const tokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: { name: 'testuser', role: 'USER', departmentName: 'Test Dept' },
      };
      authServiceMock.refresh.mockReturnValue(tokens);

      const result = controller.refresh({
        refreshToken: 'valid-refresh-token',
      });

      expect(authServiceMock.refresh).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(result).toEqual(tokens);
    });

    it('should propagate UnauthorizedException for invalid refresh token', () => {
      authServiceMock.refresh.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      expect(() =>
        controller.refresh({ refreshToken: 'invalid-token' }),
      ).toThrow(UnauthorizedException);
    });
  });
});
