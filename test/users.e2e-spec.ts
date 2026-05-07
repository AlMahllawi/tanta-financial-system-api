import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import { UserRole } from '../prisma/generated/enums.js';
import { departmentFactory } from '../prisma/seeds/department.factory.js';
import { documentFactory } from '../prisma/seeds/document.factory.js';
import { userFactory } from '../prisma/seeds/user.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createUserDtoSchema,
  dataWrapperSchema,
  userQueryDtoSchema,
  userSchema,
} from './schemas.js';
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

describe('UserController (e2e)', () => {
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;
  let testDeptName: string;
  let adminName: string;
  let userName: string;

  beforeAll(async () => {
    await bootstrapApp();
    prisma = getPrisma();
    await clearDatabase(prisma);

    const admin = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.ADMIN,
    );
    adminToken = admin.token;
    adminId = admin.id;
    adminName = admin.user.name;
    testDeptName = admin.user.departmentName;

    const user = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
      testDeptName,
    );
    userToken = user.token;
    userId = user.id;
    userName = user.user.name;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /users', () => {
    it('should return 201 User created successfully', async () => {
      const userData = await userFactory(testDeptName);
      await prisma.user.deleteMany({ where: { name: userData.name } });
      const response = await request(getHttpTarget())
        .post('/api/v0/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          createUserDtoSchema.parse({
            name: userData.name,
            password: TEST_PASSWORD,
            departmentName: userData.departmentName,
            role: userData.role,
          }),
        );
      expect(response.status).toBe(HttpStatus.CREATED);
      userSchema.parse(response.body);
    });

    it('should return 403 MISSING_ROLE for restricted resource', async () => {
      const userData = await userFactory(testDeptName);
      const response = await request(getHttpTarget())
        .post('/api/v0/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(
          createUserDtoSchema.parse({
            name: userData.name,
            password: TEST_PASSWORD,
            departmentName: userData.departmentName,
          }),
        );
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });

    it('should return 404 DEPARTMENT_NOT_FOUND', async () => {
      const nonExistentDept = departmentFactory().name;
      await prisma.department.deleteMany({ where: { name: nonExistentDept } });
      const userData = await userFactory(nonExistentDept);
      const response = await request(getHttpTarget())
        .post('/api/v0/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          createUserDtoSchema.parse({
            name: userData.name,
            password: TEST_PASSWORD,
            departmentName: userData.departmentName,
          }),
        );
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DEPARTMENT_NOT_FOUND,
        { departmentName: nonExistentDept },
      );
    });

    it('should return 409 USER_ALREADY_EXISTS', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          createUserDtoSchema.parse({
            name: adminName,
            password: TEST_PASSWORD,
            departmentName: testDeptName,
          }),
        );
      expectApiException(response, HttpStatus.CONFLICT, 'USER_ALREADY_EXISTS', {
        userName: adminName,
      });
    });
  });

  describe('GET /users', () => {
    it('should return 200 list of users', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(userSchema).parse(data);
    });

    it('should return 403 RESTRICTED_FIELD_UPDATE filtering by active status for non-admin', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/users')
        .query(userQueryDtoSchema.parse({ active: true }))
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'active' },
      );
    });
  });

  describe('GET /users/me', () => {
    it('should return 200 Current user retrieved successfully', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/users/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const body = userSchema.parse(response.body);
      expect(body.name).toBe(adminName);
    });
  });

  describe('GET /users/{id}', () => {
    it('should return 200 User retrieved successfully', async () => {
      const response = await request(getHttpTarget())
        .get(`/api/v0/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const body = userSchema.parse(response.body);
      expect(body.id).toBe(adminId);
    });

    it('should return 404 USER_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
        { userId: '999999' },
      );
    });
  });

  describe('PATCH /users/{id}', () => {
    it('should return 200 User updated successfully', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false });
      expect(response.status).toBe(HttpStatus.OK);
      const body = userSchema.parse(response.body);
      expect(body.active).toBe(false);
      await prisma.user.update({
        where: { id: userId },
        data: { active: true },
      });
    });

    it('should return 403 RESTRICTED_FIELD_UPDATE for non-admin users', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: UserRole.ADMIN, active: false });
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'role, active' },
      );
    });

    it('should return 403 MISSING_ROLE for updating another user', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: (await userFactory(testDeptName)).name });
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });

    it('should return 404 USER_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .patch('/api/v0/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false });
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
        { userId: '999999' },
      );
    });

    it('should return 404 DEPARTMENT_NOT_FOUND', async () => {
      const nonExistentDept = departmentFactory().name;
      await prisma.department.deleteMany({ where: { name: nonExistentDept } });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ departmentName: nonExistentDept });
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DEPARTMENT_NOT_FOUND,
        { departmentName: nonExistentDept },
      );
    });

    it('should return 409 USER_ALREADY_EXISTS', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: userName });
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.USER_ALREADY_EXISTS,
        { userName: userName },
      );
    });
  });

  describe('DELETE /users/{id}', () => {
    it('should return 403 MISSING_ROLE', async () => {
      const response = await request(getHttpTarget())
        .delete(`/api/v0/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });

    it('should return 404 USER_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .delete('/api/v0/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
        { userId: '999999' },
      );
    });

    it('should return 409 USER_ENGAGED_IN_SYSTEM', async () => {
      const userData = await userFactory(testDeptName);
      await prisma.user.deleteMany({ where: { name: userData.name } });
      const engagedUser = await prisma.user.create({ data: userData });
      const engagedDocData = documentFactory(engagedUser.id);
      await prisma.document.create({ data: engagedDocData });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/users/${engagedUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.USER_ENGAGED_IN_SYSTEM,
        { userId: engagedUser.id.toString() },
      );
    });

    it('should return 200 User deleted successfully', async () => {
      const userData = await userFactory(testDeptName);
      await prisma.user.deleteMany({ where: { name: userData.name } });
      const targetUser = await prisma.user.create({ data: userData });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
    });
  });
});
