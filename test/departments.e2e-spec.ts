import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import { UserRole } from '../prisma/generated/enums.js';
import { departmentFactory } from '../prisma/seeds/department.factory.js';
import { userFactory } from '../prisma/seeds/user.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createDepartmentDtoSchema,
  dataWrapperSchema,
  departmentQueryDtoSchema,
  departmentSchema,
  updateDepartmentDtoSchema,
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

describe('DepartmentsController (e2e)', () => {
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let managerId: number;
  let managerName: string;
  let testDeptName: string;

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
    testDeptName = admin.user.departmentName;
    userToken = (
      await createTestUser(
        prisma,
        getHttpTarget(),
        undefined,
        UserRole.USER,
        testDeptName,
      )
    ).token;
    const manager = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
      testDeptName,
    );
    managerId = manager.id;
    managerName = manager.user.name;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /departments', () => {
    it('should return 201 Department created successfully', async () => {
      const departmentData = departmentFactory();
      await prisma.department.deleteMany({
        where: { name: departmentData.name },
      });
      const response = await request(getHttpTarget())
        .post('/api/v0/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDepartmentDtoSchema.parse({ name: departmentData.name }));
      expect(response.status).toBe(HttpStatus.CREATED);
      const body = departmentSchema.parse(response.body);
      expect(body.name).toBe(departmentData.name);
    });

    it('should return 403 MISSING_ROLE', async () => {
      const departmentData = departmentFactory();
      const response = await request(getHttpTarget())
        .post('/api/v0/departments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createDepartmentDtoSchema.parse({ name: departmentData.name }));
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });

    it('should return 409 DEPARTMENT_ALREADY_EXISTS', async () => {
      const departmentData = departmentFactory();
      await prisma.department.upsert({
        where: { name: departmentData.name },
        update: {},
        create: departmentData,
      });
      const response = await request(getHttpTarget())
        .post('/api/v0/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDepartmentDtoSchema.parse({ name: departmentData.name }));
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.DEPARTMENT_ALREADY_EXISTS,
        { departmentName: departmentData.name },
      );
    });
  });

  describe('GET /departments', () => {
    it('should return 200 list of departments', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/departments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(departmentSchema).parse(data);
    });

    it('should return 200 filtered list of departments by name', async () => {
      const filterDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: filterDeptData.name },
        update: {},
        create: filterDeptData,
      });
      const filterSubstring = filterDeptData.name.split(' ')[0];
      const response = await request(getHttpTarget())
        .get('/api/v0/departments')
        .query(departmentQueryDtoSchema.parse({ name: filterSubstring }))
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(departmentSchema).parse(data);
      expect(parsedData.some((d) => d.name === filterDeptData.name)).toBe(true);
      expect(parsedData.every((d) => d.name.includes(filterSubstring))).toBe(
        true,
      );
    });

    it('should return 200 filtered list of departments by manager name', async () => {
      const managerFilterDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: managerFilterDeptData.name },
        update: { managerId },
        create: { name: managerFilterDeptData.name, managerId },
      });
      const response = await request(getHttpTarget())
        .get('/api/v0/departments')
        .query(departmentQueryDtoSchema.parse({ manager: managerName }))
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(departmentSchema).parse(data);
      expect(
        parsedData.some((d) => d.name === managerFilterDeptData.name),
      ).toBe(true);
    });

    it('should return 200 filtered list of departments by both name and manager', async () => {
      const managerFilterDept = await prisma.department.findFirst({
        where: { managerId },
      });
      const nameSubstring = managerFilterDept!.name.split(' ')[0];
      const response = await request(getHttpTarget())
        .get('/api/v0/departments')
        .query(
          departmentQueryDtoSchema.parse({
            name: nameSubstring,
            manager: managerName.split(' ')[0],
          }),
        )
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(departmentSchema).parse(data);
      expect(parsedData.some((d) => d.name === managerFilterDept!.name)).toBe(
        true,
      );
      await prisma.department.update({
        where: { name: managerFilterDept!.name },
        data: { managerId: null },
      });
    });
  });

  describe('GET /departments/:name', () => {
    it('should return 200 Department retrieved successfully', async () => {
      const existingDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: existingDeptData.name },
        update: {},
        create: existingDeptData,
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/departments/${encodeURIComponent(existingDeptData.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const body = departmentSchema.parse(response.body);
      expect(body.name).toBe(existingDeptData.name);
    });

    it('should return 404 DEPARTMENT_NOT_FOUND', async () => {
      const nonExistentDeptName = departmentFactory().name;
      await prisma.department.deleteMany({
        where: { name: nonExistentDeptName },
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/departments/${encodeURIComponent(nonExistentDeptName)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DEPARTMENT_NOT_FOUND,
        { departmentName: nonExistentDeptName },
      );
    });
  });

  describe('PATCH /departments/:name', () => {
    it('should return 200 Department updated successfully', async () => {
      const existingDeptName = departmentFactory().name;
      const updatedDeptName = departmentFactory().name;
      await prisma.department.upsert({
        where: { name: existingDeptName },
        update: {},
        create: { name: existingDeptName },
      });
      await prisma.user.update({
        where: { id: managerId },
        data: { departmentName: existingDeptName },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(existingDeptName)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          updateDepartmentDtoSchema.parse({ name: updatedDeptName, managerId }),
        );
      expect(response.status).toBe(HttpStatus.OK);
      const body = departmentSchema.parse(response.body);
      expect(body.name).toBe(updatedDeptName);
      expect(body.managerId).toBe(managerId);
    });

    it('should return 403 MISSING_ROLE', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(testDeptName)}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
          updateDepartmentDtoSchema.parse({ name: departmentFactory().name }),
        );
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });

    it('should return 404 DEPARTMENT_NOT_FOUND', async () => {
      const nonExistentDeptName = departmentFactory().name;
      await prisma.department.deleteMany({
        where: { name: nonExistentDeptName },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(nonExistentDeptName)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          updateDepartmentDtoSchema.parse({ name: departmentFactory().name }),
        );
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DEPARTMENT_NOT_FOUND,
        { departmentName: nonExistentDeptName },
      );
    });

    it('should return 404 MANAGER_NOT_FOUND', async () => {
      const departmentData = departmentFactory();
      await prisma.department.upsert({
        where: { name: departmentData.name },
        update: {},
        create: departmentData,
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(departmentData.name)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDepartmentDtoSchema.parse({ managerId: 999999 }));
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.MANAGER_NOT_FOUND,
        { managerId: '999999' },
      );
    });

    it('should return 409 DEPARTMENT_ALREADY_EXISTS', async () => {
      const targetDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: targetDeptData.name },
        update: {},
        create: targetDeptData,
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(testDeptName)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDepartmentDtoSchema.parse({ name: targetDeptData.name }));
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.DEPARTMENT_ALREADY_EXISTS,
        { departmentName: targetDeptData.name },
      );
    });

    it('should return 409 MANAGER_NOT_MEMBER_OF_DEPARTMENT', async () => {
      const departmentData = departmentFactory();
      await prisma.department.upsert({
        where: { name: departmentData.name },
        update: {},
        create: departmentData,
      });
      const userData = await userFactory(departmentData.name, {
        password: TEST_PASSWORD,
      });
      await prisma.user.deleteMany({ where: { name: userData.name } });
      const u = await prisma.user.create({ data: userData });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(testDeptName)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDepartmentDtoSchema.parse({ managerId: u.id }));
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.MANAGER_NOT_MEMBER_OF_DEPARTMENT,
        { managerId: String(u.id), departmentName: testDeptName },
      );
    });

    it('should return 409 MANAGER_ALREADY_MANAGES_DEPARTMENT', async () => {
      const busyDeptData = departmentFactory();
      const secondDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: busyDeptData.name },
        update: {},
        create: busyDeptData,
      });
      await prisma.department.upsert({
        where: { name: secondDeptData.name },
        update: {},
        create: secondDeptData,
      });
      const userData = await userFactory(secondDeptData.name);
      const u = await prisma.user.create({ data: userData });
      await prisma.department.update({
        where: { name: busyDeptData.name },
        data: { managerId: u.id },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/departments/${encodeURIComponent(secondDeptData.name)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDepartmentDtoSchema.parse({ managerId: u.id }));
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.MANAGER_ALREADY_MANAGES_DEPARTMENT,
        { managerId: String(u.id) },
      );
    });
  });

  describe('DELETE /departments/:name', () => {
    it('should return 403 MISSING_ROLE', async () => {
      const response = await request(getHttpTarget())
        .delete(`/api/v0/departments/${encodeURIComponent(testDeptName)}`)
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });

    it('should return 404 DEPARTMENT_NOT_FOUND', async () => {
      const nonExistentDeptName = departmentFactory().name;
      await prisma.department.deleteMany({
        where: { name: nonExistentDeptName },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/departments/${encodeURIComponent(nonExistentDeptName)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DEPARTMENT_NOT_FOUND,
        { departmentName: nonExistentDeptName },
      );
    });

    it('should return 409 DEPARTMENT_HAS_MEMBERS', async () => {
      const linkedDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: linkedDeptData.name },
        update: {},
        create: linkedDeptData,
      });
      const linkedUserData = await userFactory(linkedDeptData.name);
      await prisma.user.create({ data: linkedUserData });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/departments/${encodeURIComponent(linkedDeptData.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.DEPARTMENT_HAS_MEMBERS,
        { departmentName: linkedDeptData.name },
      );
    });

    it('should return 200 Department deleted successfully', async () => {
      const toDeleteDeptData = departmentFactory();
      await prisma.department.upsert({
        where: { name: toDeleteDeptData.name },
        update: {},
        create: toDeleteDeptData,
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/departments/${encodeURIComponent(toDeleteDeptData.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const body = departmentSchema.parse(response.body);
      expect(body.name).toBe(toDeleteDeptData.name);
    });
  });
});
