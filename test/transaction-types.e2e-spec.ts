import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import { UserRole } from '../prisma/generated/enums.js';
import { transactionFactory } from '../prisma/seeds/transaction.factory.js';
import { transactionTypeFactory } from '../prisma/seeds/transaction-type.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { dataWrapperSchema, transactionTypeSchema } from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser, expectApiException } from './utils.js';

describe('TransactionTypesController (e2e)', () => {
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminUserId: number;

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
    adminUserId = admin.id;
    adminToken = admin.token;
    userToken = (
      await createTestUser(
        prisma,
        getHttpTarget(),
        undefined,
        UserRole.USER,
        admin.user.departmentName,
      )
    ).token;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /transactions/types', () => {
    it('should return 201 Transaction type created successfully', async () => {
      const typeData = transactionTypeFactory(adminUserId);
      await prisma.transactionType.deleteMany({
        where: { name: typeData.name },
      });
      const response = await request(getHttpTarget())
        .post('/api/v0/transactions/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: typeData.name });
      expect(response.status).toBe(HttpStatus.CREATED);
      const body = transactionTypeSchema.parse(response.body);
      expect(body.name).toBe(typeData.name);
    });

    it('should return 409 TRANSACTION_TYPE_ALREADY_EXISTS', async () => {
      const duplicateName = transactionTypeFactory(adminUserId).name;
      await prisma.transactionType.upsert({
        where: { name: duplicateName },
        update: {},
        create: { name: duplicateName, creatorId: adminUserId },
      });
      const response = await request(getHttpTarget())
        .post('/api/v0/transactions/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: duplicateName });
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.TRANSACTION_TYPE_ALREADY_EXISTS,
        { typeName: duplicateName },
      );
    });
  });

  describe('GET /transactions/types', () => {
    it('should return 200 list of transaction types', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/transactions/types')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(transactionTypeSchema).parse(data);
    });

    it('should return 403 RESTRICTED_FIELD_UPDATE when filtering by creatorId as standard user', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/transactions/types?creatorId=1')
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'creatorId' },
      );
    });
  });

  describe('GET /transactions/types/:name', () => {
    it('should return 200 Transaction type retrieved successfully', async () => {
      const fetchableType = transactionTypeFactory(adminUserId);
      await prisma.transactionType.upsert({
        where: { name: fetchableType.name },
        update: {},
        create: fetchableType,
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/transactions/types/${encodeURIComponent(fetchableType.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionTypeSchema.parse(response.body);
      expect(body.name).toBe(fetchableType.name);
    });

    it('should return 404 TRANSACTION_TYPE_NOT_FOUND', async () => {
      const nonExistentTypeName = transactionTypeFactory(adminUserId).name;
      await prisma.transactionType.deleteMany({
        where: { name: nonExistentTypeName },
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/transactions/types/${encodeURIComponent(nonExistentTypeName)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
        { typeName: nonExistentTypeName },
      );
    });
  });

  describe('DELETE /transactions/types/:name', () => {
    it('should return 404 TRANSACTION_TYPE_NOT_FOUND', async () => {
      const nonExistentTypeName = transactionTypeFactory(adminUserId).name;
      await prisma.transactionType.deleteMany({
        where: { name: nonExistentTypeName },
      });
      const response = await request(getHttpTarget())
        .delete(
          `/api/v0/transactions/types/${encodeURIComponent(nonExistentTypeName)}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
        { typeName: nonExistentTypeName },
      );
    });

    it('should return 403 NOT_TRANSACTION_TYPE_CREATOR', async () => {
      const unauthType = transactionTypeFactory(adminUserId);
      await prisma.transactionType.upsert({
        where: { name: unauthType.name },
        update: {},
        create: unauthType,
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/types/${encodeURIComponent(unauthType.name)}`)
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_TYPE_CREATOR,
        { typeName: unauthType.name },
      );
    });

    it('should return 409 TRANSACTION_TYPE_IN_USE', async () => {
      const inUseType = transactionTypeFactory(adminUserId);
      await prisma.transactionType.upsert({
        where: { name: inUseType.name },
        update: {},
        create: inUseType,
      });
      const txData = transactionFactory(adminUserId, inUseType.name);
      await prisma.transaction.create({ data: txData });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/types/${encodeURIComponent(inUseType.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.TRANSACTION_TYPE_IN_USE,
        { typeName: inUseType.name },
      );
    });

    it('should return 200 Transaction type deleted successfully', async () => {
      const toDeleteType = transactionTypeFactory(adminUserId);
      await prisma.transactionType.upsert({
        where: { name: toDeleteType.name },
        update: {},
        create: toDeleteType,
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/types/${encodeURIComponent(toDeleteType.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(HttpStatus.OK);
    });
  });
});
