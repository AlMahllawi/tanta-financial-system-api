import { faker } from '@faker-js/faker';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';

import {
  TransactionForwardStatus,
  UserRole,
} from '../prisma/generated/enums.js';
import { manyDepartmentsFactory } from '../prisma/seeds/department.factory.js';
import { manyTransactionsFactory } from '../prisma/seeds/transaction.factory.js';
import { transactionFactory } from '../prisma/seeds/transaction.factory.js';
import { manyTransactionTypesFactory } from '../prisma/seeds/transaction-type.factory.js';
import { transactionTypeFactory } from '../prisma/seeds/transaction-type.factory.js';
import { manyUsersFactory } from '../prisma/seeds/user.factory.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { paginatedResponseSchema } from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser } from './utils.js';

describe('Pagination (e2e)', () => {
  let prisma: PrismaService;
  let authToken: string;
  let transactionId: number;
  let testDeptName: string;
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
    authToken = admin.token;
    testDeptName = admin.user.departmentName;
    userName = admin.user.name;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('GET /departments', () => {
    it('should return paginated data and return a 200 status with default limits', async () => {
      await prisma.department.createMany({
        data: manyDepartmentsFactory(15),
        skipDuplicates: true,
      });

      const response = await request(getHttpTarget())
        .get('/api/v0/departments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const responseBody = paginatedResponseSchema.parse(response.body);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBeLessThanOrEqual(10);
      expect(responseBody.pagination).toBeDefined();
      expect(responseBody.pagination.currentPage).toBe(1);
      expect(responseBody.pagination.perPage).toBe(10);
    });
  });

  describe('GET /departments', () => {
    it('should return paginated data and return a 200 status with specific limits', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/departments?page=2&perPage=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const responseBody = paginatedResponseSchema.parse(response.body);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBe(5);
      expect(responseBody.pagination).toBeDefined();
      expect(responseBody.pagination.currentPage).toBe(2);
      expect(responseBody.pagination.perPage).toBe(5);
    });
  });

  describe('GET /users', () => {
    it('should return paginated users and return a 200 status when requested', async () => {
      const usersData = await manyUsersFactory(15, testDeptName);
      await prisma.user.createMany({
        data: usersData,
        skipDuplicates: true,
      });

      const response = await request(getHttpTarget())
        .get('/api/v0/users?page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const responseBody = paginatedResponseSchema.parse(response.body);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBe(5);
      expect(responseBody.pagination.total).toBeGreaterThanOrEqual(15);
    });
  });

  describe('GET /transaction-types', () => {
    it('should return paginated transaction types and return a 200 status when requested', async () => {
      const user = await prisma.user.findFirst({
        where: { name: userName },
      });
      await prisma.transactionType.createMany({
        data: manyTransactionTypesFactory(15, user!.id),
        skipDuplicates: true,
      });

      const response = await request(getHttpTarget())
        .get('/api/v0/transactions/types?page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const responseBody = paginatedResponseSchema.parse(response.body);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBe(5);
      expect(responseBody.pagination.perPage).toBe(5);
    });
  });

  describe('GET /forwards', () => {
    it('should return paginated transaction forwards and return a 200 status when requested', async () => {
      const user = await prisma.user.findFirst({
        where: { name: userName },
      });

      const typeData = transactionTypeFactory(user!.id);
      const type = await prisma.transactionType.upsert({
        where: { name: typeData.name },
        update: {},
        create: typeData,
      });

      const txData = transactionFactory(user!.id, type.name);
      const transaction = await prisma.transaction.create({
        data: txData,
      });
      transactionId = transaction.id;

      await prisma.transactionForward.createMany({
        data: Array.from({ length: 15 }, () => ({
          transactionId: transaction.id,
          senderId: user!.id,
          receiverId: user!.id,
          status: TransactionForwardStatus.WAITING,
          senderComment: faker.lorem.sentence(),
        })),
      });

      const response = await request(getHttpTarget())
        .get(`/api/v0/transaction/${transactionId}/forward?page=1&perPage=5`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const responseBody = paginatedResponseSchema.parse(response.body);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBe(5);
      expect(responseBody.pagination.total).toBeGreaterThanOrEqual(15);
      expect(responseBody.pagination.perPage).toBe(5);
    });
  });

  describe('GET /transactions', () => {
    it('should return paginated transactions and return a 200 status when requested', async () => {
      const user = await prisma.user.findFirst({
        where: { name: userName },
      });

      const typeData = transactionTypeFactory(user!.id);
      const type = await prisma.transactionType.upsert({
        where: { name: typeData.name },
        update: {},
        create: typeData,
      });

      await prisma.transaction.createMany({
        data: manyTransactionsFactory(15, user!.id, type.name),
        skipDuplicates: true,
      });

      const response = await request(getHttpTarget())
        .get('/api/v0/transactions?query=all&page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const responseBody = paginatedResponseSchema.parse(response.body);
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBe(5);
      expect(responseBody.pagination.total).toBeGreaterThanOrEqual(15);
      expect(responseBody.pagination.perPage).toBe(5);
    });
  });
});
