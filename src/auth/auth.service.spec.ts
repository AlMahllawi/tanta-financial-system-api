import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { hash } from 'argon2';
import { UserRole } from '../../prisma/generated/enums.js';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userServiceMock: DeepMockProxy<UserService>;
  let jwtServiceMock: DeepMockProxy<JwtService>;
  let configServiceMock: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    userServiceMock = mockDeep<UserService>();
    jwtServiceMock = mockDeep<JwtService>();
    configServiceMock = mockDeep<ConfigService>();

    configServiceMock.getOrThrow.mockReturnValue('refresh-secret');
    configServiceMock.get.mockReturnValue('7d');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const name = 'testuser';
    const pass = 'password123';
    const userBase = {
      name,
      role: UserRole.USER,
      departmentName: 'Test Department',
      active: true,
      lastLogin: null,
      createdAt: new Date(),
    };

    it('should return user without password if validation succeeds', async () => {
      const hashedPassword = await hash(pass);
      userServiceMock.findUserForAuth.mockResolvedValue({
        ...userBase,
        hashedPassword,
      });

      const result = await service.validateUser(name, pass);

      expect(userServiceMock.findUserForAuth).toHaveBeenCalledWith(name);
      expect(result).toEqual(userBase);
      expect((result as any).hashedPassword).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      userServiceMock.findUserForAuth.mockResolvedValue(null);

      const result = await service.validateUser(name, pass);

      expect(result).toBeNull();
    });

    it('should return null if password validation fails', async () => {
      const hashedPassword = await hash('differentPassword');
      userServiceMock.findUserForAuth.mockResolvedValue({
        ...userBase,
        hashedPassword,
      });

      const result = await service.validateUser(name, pass);

      expect(result).toBeNull();
    });

    it('should return null if an error occurs', async () => {
      userServiceMock.findUserForAuth.mockRejectedValue(new Error('error'));

      const result = await service.validateUser(name, pass);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', () => {
      const user = {
        name: 'testuser',
        role: UserRole.USER,
        departmentName: 'Test Dept',
      };
      const accessToken = 'signed-jwt-token';
      const refreshToken = 'signed-refresh-token';
      jwtServiceMock.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      const result = service.login(user);

      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        name: user.name,
        role: user.role,
        department: user.departmentName,
      });

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
      });
    });
  });

  describe('refresh', () => {
    it('should return new token pair for valid refresh token', () => {
      const payload = {
        name: 'testuser',
        role: UserRole.USER,
        department: 'Test Dept',
        iat: 1234567890,
        exp: 1234567890,
      };
      const accessToken = 'new-access-token';
      const refreshToken = 'new-refresh-token';

      jwtServiceMock.verify.mockReturnValue(payload);
      jwtServiceMock.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      const result = service.refresh('valid-refresh-token');

      expect(jwtServiceMock.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'refresh-secret' },
      );
      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          name: payload.name,
          role: payload.role,
          departmentName: payload.department,
        },
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', () => {
      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      expect(() => service.refresh('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
