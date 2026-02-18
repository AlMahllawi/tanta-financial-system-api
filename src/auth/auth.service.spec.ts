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
import { User } from '../user/entities/user.entity.js';
import { plainToInstance } from 'class-transformer';

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
      id: 1,
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
      expect(result).toBe(userBase.id);
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
    it('should return access and refresh tokens and update last login', async () => {
      const user = plainToInstance(User, {
        id: 1,
        name: 'testuser',
        role: UserRole.USER,
        departmentName: 'Test Dept',
        hashedPassword: 'hashed',
        createdAt: new Date('2026-01-01'),
        active: true,
        lastLogin: null,
      });
      const updatedUser = { ...user, lastLogin: new Date() };
      const accessToken = 'signed-jwt-token';
      const refreshToken = 'signed-refresh-token';

      userServiceMock.updateLastLogin.mockResolvedValue(updatedUser);
      jwtServiceMock.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      const result = await service.login(user.id);

      expect(userServiceMock.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        id: user.id,
      });

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: updatedUser,
      });
    });
  });

  describe('refresh', () => {
    it('should return new token pair for valid refresh token', async () => {
      const payload = {
        id: 1,
        iat: 1234567890,
        exp: 1234567890,
      };
      const accessToken = 'new-access-token';
      const refreshToken = 'new-refresh-token';
      const userFromDb = plainToInstance(User, {
        id: 1,
        name: 'testuser',
        role: UserRole.USER,
        departmentName: 'Test Dept',
        hashedPassword: 'hashed',
        createdAt: new Date('2026-01-01'),
        active: true,
        lastLogin: null,
      });

      jwtServiceMock.verify.mockReturnValue(payload);
      jwtServiceMock.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      userServiceMock.findOne.mockResolvedValue(userFromDb);

      const result = await service.refresh('valid-refresh-token');

      expect(jwtServiceMock.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'refresh-secret' },
      );
      expect(userServiceMock.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userFromDb,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
