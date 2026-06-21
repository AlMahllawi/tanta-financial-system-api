import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import {
  TransactionForwardStatus,
  UserRole,
} from '../prisma/generated/enums.js';
import { transactionFactory } from '../prisma/seeds/transaction.factory.js';
import { transactionForwardFactory } from '../prisma/seeds/transaction-forward.factory.js';
import { transactionTypeFactory } from '../prisma/seeds/transaction-type.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createTransactionForwardDtoSchema,
  dataWrapperSchema,
  transactionForwardReceivedArgsSchema,
  transactionForwardRespondedArgsSchema,
  transactionForwardSchema,
  updateTransactionForwardDtoSchema,
  updateTransactionForwardSenderDtoSchema,
} from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser, expectApiException } from './utils.js';

describe('Transaction Forwarding (e2e)', () => {
  let prisma: PrismaService;

  let senderToken: string;
  let receiverToken: string;
  let otherToken: string;

  let senderId: number;
  let receiverId: number;
  let otherId: number;
  let testTypeName: string;

  beforeAll(async () => {
    await bootstrapApp();
    prisma = getPrisma();

    await clearDatabase(prisma);

    const sender = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.ADMIN,
    );
    senderId = sender.id;
    senderToken = sender.token;

    const receiver = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
      sender.user.departmentName,
    );
    receiverId = receiver.id;
    receiverToken = receiver.token;

    const other = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
      sender.user.departmentName,
    );
    otherId = other.id;
    otherToken = other.token;

    testTypeName = transactionTypeFactory(senderId).name;

    await prisma.transactionType.upsert({
      where: { name: testTypeName },
      update: {},
      create: { name: testTypeName, creatorId: senderId },
    });
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  async function createTx(title?: string, customCreatorId?: number) {
    const txData = transactionFactory(
      customCreatorId ?? senderId,
      testTypeName,
      { fulfilled: false },
    );
    const tx = await prisma.transaction.create({
      data: {
        ...txData,
        title: title ?? txData.title,
      },
    });
    return tx.id;
  }

  describe('POST /transaction/:id/forward', () => {
    it('should return 201 Transaction forwarded successfully', async () => {
      const txId = await createTx();
      const fwdData = transactionForwardFactory(txId, senderId, receiverId);

      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send(
          createTransactionForwardDtoSchema.parse({
            receiverId: fwdData.receiverId,
            comment: fwdData.senderComment,
          }),
        );

      expect(response.status).toBe(HttpStatus.CREATED);
      const forward = transactionForwardSchema.parse(response.body);

      const notification = await prisma.notification.findFirst({
        where: {
          userId: receiverId,
          code: 'TRANSACTION_FORWARD_RECEIVED',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(notification).not.toBeNull();
      const args = transactionForwardReceivedArgsSchema.parse(
        notification!.args,
      );
      expect(args.transactionId).toBe(String(txId));
      expect(args.forwardId).toBe(String(forward.id));
    });

    it('should return 404 TRANSACTION_NOT_FOUND (transactionId fallback match)', async () => {
      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/999999/forward`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send(createTransactionForwardDtoSchema.parse({ receiverId }));

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
        {
          transactionId: '999999',
        },
      );
    });

    it('should return 404 TRANSACTION_FORWARD_RECEIVER_NOT_FOUND', async () => {
      const txId = await createTx();

      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send(createTransactionForwardDtoSchema.parse({ receiverId: 999999 }));

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_RECEIVER_NOT_FOUND,
        { receiverId: '999999' },
      );
    });

    it('should return 403 NOT_TRANSACTION_CREATOR', async () => {
      const txId = await createTx(undefined, senderId);

      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(createTransactionForwardDtoSchema.parse({ receiverId }));

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_TRANSACTION_CREATOR,
        { transactionId: String(txId) },
      );
    });

    it('should return 403 TRANSACTION_ALREADY_FULFILLED', async () => {
      const txId = await createTx();
      await prisma.transaction.update({
        where: { id: txId },
        data: { fulfilled: true },
      });

      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send(createTransactionForwardDtoSchema.parse({ receiverId }));

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_ALREADY_FULFILLED,
        { transactionId: String(txId) },
      );
    });

    it('should return 403 NOT_LATEST_RECEIVER', async () => {
      const txId = await createTx();
      await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId,
          receiverId,
          status: TransactionForwardStatus.APPROVED,
        },
      });

      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(
          createTransactionForwardDtoSchema.parse({ receiverId: senderId }),
        );

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_LATEST_RECEIVER,
        {
          transactionId: String(txId),
        },
      );
    });

    it('should return 403 FORWARD_NOT_RESPONDED', async () => {
      const txId = await createTx();
      await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });

      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(createTransactionForwardDtoSchema.parse({ receiverId: otherId }));

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_NOT_RESPONDED,
        {
          transactionId: String(txId),
        },
      );
    });
  });

  describe('GET /transaction/:id/forward', () => {
    it('should return 200 PaginatedResponse of forwards', async () => {
      const txId = await createTx();
      await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId,
          receiverId,
          status: TransactionForwardStatus.APPROVED,
        },
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/transaction/${txId}/forward`)
        .set('Authorization', `Bearer ${senderToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(transactionForwardSchema).parse(data);
    });
  });

  describe('GET /transaction/:id/forward/:fwdId', () => {
    it('should return 200 Transaction forward retrieved successfully', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .get(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${senderToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionForwardSchema.parse(response.body);
      expect(body.id).toBe(fwd.id);
    });

    it('should return 404 TRANSACTION_FORWARD_NOT_FOUND', async () => {
      const txId = await createTx();
      const response = await request(getHttpTarget())
        .get(`/api/v0/transaction/${txId}/forward/999999`)
        .set('Authorization', `Bearer ${senderToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { forwardId: '999999', transactionId: txId.toString() },
      );
    });
  });

  describe('PATCH /transaction/:id/forward/:fwdId', () => {
    it('should return 200 Transaction forward updated successfully', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send(
          updateTransactionForwardSenderDtoSchema.parse({
            comment: 'New comment',
          }),
        );

      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionForwardSchema.parse(response.body);
      expect(body.senderComment).toBe('New comment');
    });

    it('should return 404 TRANSACTION_FORWARD_NOT_FOUND', async () => {
      const txId = await createTx();
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transaction/${txId}/forward/999999`)
        .set('Authorization', `Bearer ${senderToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { forwardId: '999999', transactionId: String(txId) },
      );
    });

    it('should return 403 NOT_FORWARD_SENDER', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(updateTransactionForwardSenderDtoSchema.parse({ comment: 'B' }));

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_FORWARD_SENDER,
        {
          forwardId: String(fwd.id),
        },
      );
    });

    it('should return 403 FORWARD_ALREADY_RESPONDED', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId,
          receiverId,
          status: TransactionForwardStatus.APPROVED,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send(updateTransactionForwardSenderDtoSchema.parse({ comment: 'B' }));

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_RESPONDED,
        { forwardId: String(fwd.id) },
      );
    });
  });

  describe('POST /transaction/:id/forward/:fwdId/response', () => {
    it('should return 201 Transaction forward response created successfully', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward/${fwd.id}/response`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(
          updateTransactionForwardDtoSchema.parse({
            status: TransactionForwardStatus.APPROVED,
          }),
        );

      expect(response.status).toBe(HttpStatus.CREATED);

      const notification = await prisma.notification.findFirst({
        where: {
          userId: senderId,
          code: 'TRANSACTION_FORWARD_RESPONDED',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(notification).not.toBeNull();
      const args = transactionForwardRespondedArgsSchema.parse(
        notification!.args,
      );
      expect(args.transactionId).toBe(String(txId));
      expect(args.forwardId).toBe(String(fwd.id));
      expect(args.status).toBe(TransactionForwardStatus.APPROVED);
    });

    it('should return 404 TRANSACTION_FORWARD_NOT_FOUND', async () => {
      const txId = await createTx();
      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward/999999/response`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(
          updateTransactionForwardDtoSchema.parse({
            status: TransactionForwardStatus.APPROVED,
          }),
        );

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { forwardId: '999999', transactionId: String(txId) },
      );
    });

    it('should return 403 NOT_FORWARD_RECEIVER', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward/${fwd.id}/response`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(
          updateTransactionForwardDtoSchema.parse({
            status: TransactionForwardStatus.REJECTED,
          }),
        );

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_FORWARD_RECEIVER,
        {
          forwardId: String(fwd.id),
        },
      );
    });

    it('should return 403 FORWARD_ALREADY_SEEN', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId,
          receiverId,
          status: TransactionForwardStatus.APPROVED,
          senderSeen: true,
          receiverComment: 'comment',
        },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward/${fwd.id}/response`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(
          updateTransactionForwardDtoSchema.parse({
            status: TransactionForwardStatus.REJECTED,
          }),
        );

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_SEEN,
        {
          forwardId: String(fwd.id),
        },
      );
    });

    it('should return 403 FORWARD_ALREADY_RESPONDED', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId,
          receiverId,
          status: TransactionForwardStatus.APPROVED,
        },
      });
      await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId: receiverId,
          receiverId: otherId,
        },
      });
      const response = await request(getHttpTarget())
        .post(`/api/v0/transaction/${txId}/forward/${fwd.id}/response`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(
          updateTransactionForwardDtoSchema.parse({
            status: TransactionForwardStatus.REJECTED,
          }),
        );

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_RESPONDED,
        { forwardId: String(fwd.id) },
      );
    });
  });

  describe('PATCH /transaction/:id/forward/:fwdId/response', () => {
    it('should return 200 Transaction forward response updated', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: {
          transactionId: txId,
          senderId,
          receiverId,
          status: TransactionForwardStatus.APPROVED,
        },
      });
      const response = await request(getHttpTarget())
        .patch(`/api/v0/transaction/${txId}/forward/${fwd.id}/response`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send(
          updateTransactionForwardDtoSchema.parse({
            status: TransactionForwardStatus.REJECTED,
          }),
        );

      expect(response.status).toBe(HttpStatus.OK);
      const body = transactionForwardSchema.parse(response.body);
      expect(body.status).toBe(TransactionForwardStatus.REJECTED);
    });
  });

  describe('DELETE /transaction/:id/forward/:fwdId', () => {
    it('should return 200 Transaction forward removed successfully', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${senderToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it('should return 404 TRANSACTION_FORWARD_NOT_FOUND', async () => {
      const txId = await createTx();
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transaction/${txId}/forward/999999`)
        .set('Authorization', `Bearer ${senderToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_FORWARD_NOT_FOUND,
        { forwardId: '999999', transactionId: String(txId) },
      );
    });

    it('should return 403 NOT_FORWARD_SENDER', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${receiverToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_FORWARD_SENDER,
        {
          forwardId: String(fwd.id),
        },
      );
    });

    it('should return 403 FORWARD_ALREADY_SEEN', async () => {
      const txId = await createTx();
      const fwd = await prisma.transactionForward.create({
        data: { transactionId: txId, senderId, receiverId, receiverSeen: true },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/transaction/${txId}/forward/${fwd.id}`)
        .set('Authorization', `Bearer ${senderToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORWARD_ALREADY_SEEN,
        {
          forwardId: String(fwd.id),
        },
      );
    });
  });
});
