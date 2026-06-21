import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import {
  NotificationType,
  TransactionForwardStatus,
  UserRole,
} from '../prisma/generated/enums.js';
import { documentFactory } from '../prisma/seeds/document.factory.js';
import { transactionFactory } from '../prisma/seeds/transaction.factory.js';
import { transactionTypeFactory } from '../prisma/seeds/transaction-type.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  budgetAllocationOverflowArgsSchema,
  createTransactionDtoSchema,
  dataWrapperSchema,
  notificationSchema,
  transactionSchema,
  transactionSummarySchema,
} from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser, expectApiException } from './utils.js';

describe('TransactionsController (e2e)', () => {
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;

  let otherToken: string;
  let accountantToken: string;

  let adminId: number;
  let userId: number;
  let otherId: number;
  let accountantId: number;
  let validDocId: number;
  let testTypeName: string;

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
    adminId = admin.id;
    adminToken = admin.token;

    const u = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
      admin.user.departmentName,
    );
    userId = u.id;
    userToken = u.token;

    const oth = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
      admin.user.departmentName,
    );
    otherId = oth.id;
    otherToken = oth.token;

    const accountant = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.ACCOUNTANT,
      admin.user.departmentName,
    );
    accountantId = accountant.id;
    accountantToken = accountant.token;

    testTypeName = transactionTypeFactory(adminId).name;

    await prisma.transactionType.upsert({
      where: { name: testTypeName },
      update: {},
      create: { name: testTypeName, creatorId: adminId },
    });

    const docData = documentFactory(adminId);
    const doc = await prisma.document.create({
      data: docData,
    });
    validDocId = doc.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /transactions', () => {
    it('should return 201 Transaction created successfully', async () => {
      const txData = transactionFactory(userId, testTypeName);
      const response = await request(getHttpTarget())
        .post('/api/v0/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(
          createTransactionDtoSchema.parse({
            title: txData.title,
            description: txData.description,
            typeName: txData.typeName,
          }),
        );

      expect(response.status).toBe(HttpStatus.CREATED);
      transactionSchema.parse(response.body);
    });

    it('should return 404 TRANSACTION_TYPE_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(
          createTransactionDtoSchema.parse({
            title: 'Valid Name Tx',
            description: 'Desc',
            typeName: 'UnknownXYZ123',
          }),
        );

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
        { typeName: 'UnknownXYZ123' },
      );
    });

    it('should return 404 DOCUMENT_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(
          createTransactionDtoSchema.parse({
            title: 'Valid Name Tx',
            description: 'Desc',
            typeName: testTypeName,
            documentsIds: [999999],
          }),
        );

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DOCUMENT_NOT_FOUND,
        {
          documentId: '999999',
        },
      );
    });
  });

  describe('GET /transactions', () => {
    it('should return 200 PaginatedTransactionSummaryResponseDto', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(transactionSummarySchema).parse(data);
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return 200 Transaction retrieved successfully', async () => {
      const txData = transactionFactory(userId, testTypeName);
      const tx = await prisma.transaction.create({
        data: txData,
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionSchema.parse(response.body);
      expect(body.id).toBe(tx.id);
    });

    it('should return 404 TRANSACTION_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .get(`/api/v0/transactions/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        {
          transactionId: '999999',
        },
      );
    });

    it('should return 403 NOT_TRANSACTION_PARTICIPANT', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Other Tx',
          description: '',
          typeName: testTypeName,
          creatorId: otherId,
        },
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_PARTICIPANT,
        { transactionId: String(tx.id) },
      );
    });
  });

  describe('PATCH /transactions/:id', () => {
    it('should return 200 Transaction updated successfully', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Patch Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'New description' });

      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionSchema.parse(response.body);
      expect(body.description).toBe('New description');
    });

    it('should return 404 TRANSACTION_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .patch('/api/v0/transactions/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'A' });

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        {
          transactionId: '999999',
        },
      );
    });

    it('should return 404 TRANSACTION_TYPE_NOT_FOUND', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Patch Type Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ typeName: 'Bad TypeXYZ' });

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_TYPE_NOT_FOUND,
        { typeName: 'Bad TypeXYZ' },
      );
    });

    it('should return 403 RESTRICTED_FIELD_UPDATE', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Patch Field Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fulfilled: true });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.RESTRICTED_FIELD_UPDATE,
        { fields: 'fulfilled' },
      );
    });

    it('should allow accountant to update accountant fields', async () => {
      await prisma.budgetCategory.upsert({
        where: { name: 'General' },
        update: {},
        create: { name: 'General' },
      });
      await prisma.budgetEntry.create({
        data: {
          budgetName: 'General',
          amount: 1000,
          inputterId: adminId,
        },
      });
      const tx = await prisma.transaction.create({
        data: {
          title: 'Accountant Update Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });

      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: userId,
          receiverId: accountantId,
          status: TransactionForwardStatus.APPROVED,
        },
      });

      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          fulfilled: true,
          budgetName: 'General',
          budgetAllocation: 100,
        });

      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionSchema.parse(response.body);
      expect(body.fulfilled).toBe(true);
      expect(body.budgetName).toBe('General');
      expect(body.budgetAllocation).toBe(100);
    });

    it('should return 403 TRANSACTION_NOT_APPROVED when accountant tries to update not approved transaction', async () => {
      await prisma.budgetCategory.upsert({
        where: { name: 'General' },
        update: {},
        create: { name: 'General' },
      });
      await prisma.budgetEntry.create({
        data: {
          budgetName: 'General',
          amount: 1000,
          inputterId: adminId,
        },
      });
      const tx = await prisma.transaction.create({
        data: {
          title: 'Accountant Update Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: userId,
          receiverId: accountantId,
          status: TransactionForwardStatus.WAITING,
        },
      });

      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          fulfilled: true,
          budgetName: 'General',
          budgetAllocation: 100,
        });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_NOT_APPROVED,
        { transactionId: String(tx.id) },
      );
    });

    it('should return 403 NOT_LATEST_ACCOUNTANT when accountant tries to update transaction forwarded to another accountant', async () => {
      await prisma.budgetCategory.upsert({
        where: { name: 'General' },
        update: {},
        create: { name: 'General' },
      });
      await prisma.budgetEntry.create({
        data: {
          budgetName: 'General',
          amount: 1000,
          inputterId: adminId,
        },
      });
      const tx = await prisma.transaction.create({
        data: {
          title: 'Accountant Bad Update Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      // Forward to someone else (otherId)
      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: userId,
          receiverId: otherId,
          status: TransactionForwardStatus.APPROVED,
        },
      });

      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          fulfilled: true,
          budgetName: 'General',
          budgetAllocation: 100,
        });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_LATEST_ACCOUNTANT,
        { transactionId: String(tx.id) },
      );
    });

    it('should return 400 MISSING_BUDGET_INFO', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Missing Budget Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fulfilled: true });

      expectApiException(
        response,
        HttpStatus.BAD_REQUEST,
        ErrorCode.MISSING_BUDGET_INFO,
        { required: 'budgetName, budgetAllocation' },
      );
    });

    it('should return 403 NOT_TRANSACTION_CREATOR when accountant tries to update non-accountant fields', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Accountant Bad Update Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ title: 'New Title' });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_CREATOR,
        { transactionId: String(tx.id) },
      );
    });

    it('should return 403 INSUFFICIENT_BUDGET when allocation exceeds available budget', async () => {
      const budgetName = 'Limited Budget';
      await prisma.budgetCategory.upsert({
        where: { name: budgetName },
        update: {},
        create: { name: budgetName },
      });
      await prisma.budgetEntry.create({
        data: {
          budgetName,
          amount: 50,
          inputterId: adminId,
        },
      });

      const tx = await prisma.transaction.create({
        data: {
          title: 'Overbudget Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });

      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: userId,
          receiverId: accountantId,
          status: TransactionForwardStatus.APPROVED,
        },
      });

      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          fulfilled: true,
          budgetName,
          budgetAllocation: 100,
        });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.INSUFFICIENT_BUDGET,
        {
          categoryName: budgetName,
          availableAmount: '50',
          requestedAmount: '100',
        },
      );
    });
    it('should create a warning notification for admins when budget overflow is attempted', async () => {
      const budgetName = 'E2E Overflow Budget';
      await prisma.budgetCategory.upsert({
        where: { name: budgetName },
        update: {},
        create: { name: budgetName },
      });
      await prisma.budgetEntry.create({
        data: {
          budgetName,
          amount: 100,
          inputterId: adminId,
        },
      });

      const tx = await prisma.transaction.create({
        data: {
          title: 'E2E Overflow Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });

      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: userId,
          receiverId: accountantId,
          status: TransactionForwardStatus.APPROVED,
        },
      });

      // Attempt update that overflows budget
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          fulfilled: true,
          budgetName,
          budgetAllocation: 200,
        });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.INSUFFICIENT_BUDGET,
        {
          categoryName: budgetName,
          availableAmount: '100',
          requestedAmount: '200',
        },
      );

      // Verify notification was created for admin
      const notification = await prisma.notification.findFirst({
        where: {
          userId: adminId,
          code: 'BUDGET_ALLOCATION_OVERFLOW_ATTEMPT',
        },
        orderBy: { id: 'desc' },
      });

      expect(notification).not.toBeNull();
      const parsedNotification = notificationSchema.parse(
        JSON.parse(JSON.stringify(notification)),
      );
      expect(parsedNotification.type).toBe(NotificationType.WARNING);

      const parsedArgs = budgetAllocationOverflowArgsSchema.parse(
        parsedNotification.args,
      );
      expect(parsedArgs.requestedAmount).toBe('200');
      expect(parsedArgs.availableAmount).toBe('100');
      expect(parsedArgs.attemptedBy).toBe(accountantId.toString());
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('should return 404 TRANSACTION_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .delete('/api/v0/transactions/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        {
          transactionId: '999999',
        },
      );
    });

    it('should return 409 TRANSACTION_HAS_FORWARDS', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Delete Forward Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: adminId,
          receiverId: userId,
        },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.TRANSACTION_HAS_FORWARDS,
        { transactionId: tx.id.toString() },
      );
    });

    it('should return 200 Transaction deleted successfully', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Delete Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('Document Assignment', () => {
    it('should return 200 Document attached to transaction successfully', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Attach Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transactions/${tx.id}/document/${validDocId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it('should return 404 TRANSACTION_NOT_FOUND (Attach)', async () => {
      const response = await request(getHttpTarget())
        .post(`/api/v0/transactions/999999/document/${validDocId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        {
          transactionId: '999999',
        },
      );
    });

    it('should return 404 DOCUMENT_NOT_FOUND (Attach)', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Attach Bad Doc Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transactions/${tx.id}/document/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DOCUMENT_NOT_FOUND,
        {
          documentId: '999999',
        },
      );
    });

    it('should return 403 FORWARD_ALREADY_SEEN', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Forward Seen Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: userId,
          receiverId: adminId,
          receiverSeen: true,
        },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transactions/${tx.id}/document/${validDocId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_SEEN,
        {
          forwardId: expect.any(String),
        },
      );
    });

    it('should return 200 when receiver attaches document after responding', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Forward Responded Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      await prisma.transactionForward.create({
        data: {
          transactionId: tx.id,
          senderId: adminId,
          receiverId: userId,
          status: TransactionForwardStatus.APPROVED,
        },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transactions/${tx.id}/document/${validDocId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it('should return 403 NOT_DOCUMENT_ATTACHER', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Not Attacher Tx',
          description: '',
          typeName: testTypeName,
          creatorId: userId,
        },
      });
      await prisma.transactionDocument.create({
        data: {
          transactionId: tx.id,
          documentId: validDocId,
          attachedBy: userId,
        },
      });
      await prisma.transactionForward.create({
        data: { transactionId: tx.id, senderId: userId, receiverId: otherId },
      });

      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/${tx.id}/document/${validDocId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_ATTACHER,
        {
          transactionId: String(tx.id),
          documentId: String(validDocId),
        },
      );
    });

    it('should return 403 NOT_DOCUMENT_ATTACHER when participant trying to delete', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Not Attacher Tx 2',
          description: '',
          typeName: testTypeName,
          creatorId: otherId,
        },
      });
      await prisma.transactionForward.create({
        data: { transactionId: tx.id, senderId: otherId, receiverId: userId },
      });
      await prisma.transactionDocument.create({
        data: {
          transactionId: tx.id,
          documentId: validDocId,
          attachedBy: otherId,
        },
      });

      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/${tx.id}/document/${validDocId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_ATTACHER,
        {
          transactionId: String(tx.id),
          documentId: String(validDocId),
        },
      );
    });

    it('should return 200 Document detached from transaction successfully', async () => {
      const tx = await prisma.transaction.create({
        data: {
          title: 'Detach Tx',
          description: '',
          typeName: testTypeName,
          creatorId: adminId,
        },
      });
      await prisma.transactionDocument.create({
        data: {
          transactionId: tx.id,
          documentId: validDocId,
          attachedBy: adminId,
        },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transactions/${tx.id}/document/${validDocId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });
});
