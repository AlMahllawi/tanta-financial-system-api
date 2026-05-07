import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import { UserRole } from '../prisma/generated/enums.js';
import { documentFactory } from '../prisma/seeds/document.factory.js';
import { transactionFactory } from '../prisma/seeds/transaction.factory.js';
import { transactionTypeFactory } from '../prisma/seeds/transaction-type.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { dataWrapperSchema, documentSchema } from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser, expectApiException } from './utils.js';

describe('DocumentsController (e2e)', () => {
  let prisma: PrismaService;
  let userToken: string;
  let userId: number;

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
    userId = admin.id;
    userToken = admin.token;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /documents', () => {
    it('should return 201 Document uploaded successfully', async () => {
      const docData = documentFactory(userId);
      const response = await request(getHttpTarget())
        .post('/api/v0/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', docData.content, docData.title);
      expect(response.status).toBe(HttpStatus.CREATED);
      const body = documentSchema.parse(response.body);
      expect(body.title).toBe(docData.title);
    });

    it('should return 400 Bad Request when missing file', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/documents')
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 Bad Request when invalid file type', async () => {
      const response = await request(getHttpTarget())
        .post('/api/v0/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('plain text'), 'bad.txt');
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /documents/uploaded', () => {
    it('should return 200 list of documents', async () => {
      let doc = await prisma.document.findFirst({
        where: { uploaderId: userId },
      });
      if (!doc) {
        const docData = documentFactory(userId);
        doc = await prisma.document.create({
          data: {
            title: docData.title,
            content: docData.content,
            uploaderId: userId,
          },
        });
      }
      const response = await request(getHttpTarget())
        .get('/api/v0/documents/uploaded')
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const body = z.array(documentSchema).parse(data);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /documents/:id', () => {
    it('should return 200 Document retrieved successfully', async () => {
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const response = await request(getHttpTarget())
        .get(`/api/v0/documents/${doc.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const body = documentSchema.parse(response.body);
      expect(body.id).toBe(doc.id);
      expect(body.title).toBe(docData.title);
    });

    it('should return 404 DOCUMENT_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/documents/999999')
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DOCUMENT_NOT_FOUND,
        { documentId: '999999' },
      );
    });

    it('should return 403 NOT_DOCUMENT_VIEWER', async () => {
      const otherUser = await createTestUser(
        prisma,
        getHttpTarget(),
        'Other Viewer',
      );
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const response = await request(getHttpTarget())
        .get(`/api/v0/documents/${doc.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_VIEWER,
        { documentId: String(doc.id) },
      );
    });
  });

  describe('GET /documents/:id/download', () => {
    it('should return 200 Document downloaded successfully', async () => {
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const response = await request(getHttpTarget())
        .get(`/api/v0/documents/${doc.id}/download`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toContain(
        `attachment; filename="${docData.title}"`,
      );
    });

    it('should return 404 DOCUMENT_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/documents/999999/download')
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DOCUMENT_NOT_FOUND,
        { documentId: '999999' },
      );
    });

    it('should return 403 NOT_DOCUMENT_VIEWER', async () => {
      const otherUser = await createTestUser(
        prisma,
        getHttpTarget(),
        'Other Viewer',
      );
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const response = await request(getHttpTarget())
        .get(`/api/v0/documents/${doc.id}/download`)
        .set('Authorization', `Bearer ${otherUser.token}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_VIEWER,
        { documentId: String(doc.id) },
      );
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should return 404 DOCUMENT_NOT_FOUND', async () => {
      const response = await request(getHttpTarget())
        .delete('/api/v0/documents/999999')
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.DOCUMENT_NOT_FOUND,
        { documentId: '999999' },
      );
    });

    it('should return 403 DOCUMENT_ALREADY_USED', async () => {
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const typeData = transactionTypeFactory(userId);
      await prisma.transactionType.upsert({
        where: { name: typeData.name },
        update: {},
        create: typeData,
      });
      const txData = transactionFactory(userId, typeData.name);
      const tx = await prisma.transaction.create({ data: txData });
      await prisma.transactionDocument.create({
        data: { transactionId: tx.id, documentId: doc.id, attachedBy: userId },
      });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/documents/${doc.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.DOCUMENT_ALREADY_USED,
        { documentId: doc.id.toString() },
      );
    });

    it('should return 403 NOT_DOCUMENT_UPLOADER', async () => {
      const otherUser = await createTestUser(
        prisma,
        getHttpTarget(),
        'Other User',
      );
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/documents/${doc.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);
      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_UPLOADER,
        { documentId: String(doc.id) },
      );
    });

    it('should return 200 Document deleted successfully', async () => {
      const docData = documentFactory(userId);
      const doc = await prisma.document.create({ data: docData });
      const response = await request(getHttpTarget())
        .delete(`/api/v0/documents/${doc.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(HttpStatus.OK);
      const nextResponse = await request(getHttpTarget())
        .get(`/api/v0/documents/${doc.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(nextResponse.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
