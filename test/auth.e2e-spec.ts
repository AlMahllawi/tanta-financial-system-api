import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import { UserRole } from '../prisma/generated/enums.js';
import { userFactory } from '../prisma/seeds/user.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { authResponseSchema, userSchema } from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import {
  clearDatabase,
  createTestUser,
  expectApiException,
  TEST_PASSWORD,
} from './utils.js';

describe('AuthController (e2e)', () => {
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;

  let userData: Awaited<ReturnType<typeof userFactory>>;
  let testUserSchema: z.ZodType;
  let testAuthResponseSchema: z.ZodType;

  beforeAll(async () => {
    await bootstrapApp();
    prisma = getPrisma();

    const result = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.ADMIN,
    );
    userData = result.user as Awaited<ReturnType<typeof userFactory>>;

    testUserSchema = userSchema.extend({
      name: z.literal(userData.name),
      active: z.literal(true),
      role: z.literal(UserRole.ADMIN),
      departmentName: z.literal(userData.departmentName),
    });

    testAuthResponseSchema = authResponseSchema.extend({
      user: testUserSchema,
    });
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /auth/login', () => {
    it('should authenticate the user and return a 200 status when credentials are valid', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/auth/login')
        .send({ name: userData.name, password: TEST_PASSWORD });

      expect(response.status).toBe(HttpStatus.OK);

      const body = testAuthResponseSchema.parse(response.body) as z.infer<
        typeof authResponseSchema
      >;
      accessToken = body.access_token;
      refreshToken = body.refresh_token;
    });

    it('should fail authentication and return a 401 status when credentials are invalid', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/auth/login')
        .send({ name: userData.name, password: 'WrongPassword1' });

      expectApiException(
        response,
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh the token and return a 200 status when refresh token is valid', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(HttpStatus.OK);

      testAuthResponseSchema.parse(response.body);
    });

    it('should not refresh the token and return a 401 status when refresh token is invalid', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/auth/refresh')
        .send({ refreshToken: 'invalid-token-xyz' });

      expectApiException(
        response,
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
      );
    });
  });

  describe('GET /users/me (Authorization)', () => {
    it('should return user info when a valid token is provided', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(HttpStatus.OK);

      testUserSchema.parse(response.body);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(getHttpTarget()).get('/api/v0/users/me');
      expectApiException(
        response,
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    });

    it('should return 401 when an invalid token is provided', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/users/me')
        .set('Authorization', 'Bearer invalid-token');
      expectApiException(
        response,
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    });
  });
});
