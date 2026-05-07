import { HttpStatus } from '@nestjs/common';
import * as http from 'http';
import request from 'supertest';
import { z } from 'zod';

import { NotificationType, UserRole } from '../prisma/generated/enums.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { NotificationService } from '../src/notification/notification.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  dataWrapperSchema,
  notificationQueryDtoSchema,
  notificationSchema,
  updateSeenDtoSchema,
} from './schemas.js';
import {
  bootstrapApp,
  describeInternal,
  getHttpTarget,
  getModule,
  getPrisma,
  isExternalMode,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser, expectApiException } from './utils.js';

describe('NotificationsController (e2e)', () => {
  let prisma: PrismaService;

  let user1Token: string;
  let user1Id: number;
  let user2Token: string;
  let user2Id: number;

  let notificationService: NotificationService | null = null;

  beforeAll(async () => {
    await bootstrapApp();
    prisma = getPrisma();

    if (!isExternalMode())
      notificationService =
        getModule().get<NotificationService>(NotificationService);

    await clearDatabase(prisma);

    const user1 = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
    );
    user1Token = user1.token;
    user1Id = user1.id;

    const user2 = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.USER,
    );
    user2Token = user2.token;
    user2Id = user2.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('GET /notifications', () => {
    beforeEach(async () => {
      await prisma.notification.deleteMany();
      await prisma.notification.createMany({
        data: [
          {
            userId: user1Id,
            type: NotificationType.INFO,
            code: 'WELCOME_USER',
            args: { name: 'user1' },
            timestamp: new Date('2026-05-01T10:00:00Z'),
          },
          {
            userId: user1Id,
            type: NotificationType.WARNING,
            code: 'ALERT_WARNING',
            args: { target: 'user1' },
            timestamp: new Date('2026-05-03T10:00:00Z'),
          },
          {
            userId: user2Id,
            type: NotificationType.INFO,
            code: 'WELCOME_USER',
            args: { name: 'user2' },
          },
        ],
      });
    });

    it('should return 200 list of notifications for current user', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/notifications')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(notificationSchema).parse(data);
      expect(parsedData.length).toBe(2);
      expect(parsedData.every((n) => n.userId === user1Id)).toBe(true);
    });

    it('should return filtered list by startDate', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/notifications')
        .query(
          notificationQueryDtoSchema.parse({
            startDate: '2026-05-02T00:00:00Z',
          }),
        )
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(notificationSchema).parse(data);
      expect(parsedData.length).toBe(1);
      expect(parsedData[0].code).toBe('ALERT_WARNING');
    });

    it('should return filtered list by endDate', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/notifications')
        .query(
          notificationQueryDtoSchema.parse({ endDate: '2026-05-02T00:00:00Z' }),
        )
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(notificationSchema).parse(data);
      expect(parsedData.length).toBe(1);
      expect(parsedData[0].code).toBe('WELCOME_USER');
    });
  });

  describe('PATCH /notifications/:id/seen', () => {
    let notificationId: number;

    beforeEach(async () => {
      await prisma.notification.deleteMany();
      const n = await prisma.notification.create({
        data: {
          userId: user1Id,
          type: NotificationType.INFO,
          code: 'UNREAD_MESSAGE',
          args: { message: 'This is unread' },
          seen: false,
        },
      });
      notificationId = n.id;
    });

    it('should return 200 and update seen status', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/notifications/${notificationId}/seen`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateSeenDtoSchema.parse({ seen: true }));

      expect(response.status).toBe(HttpStatus.OK);
      const body = notificationSchema.parse(response.body);
      expect(body.id).toBe(notificationId);
      expect(body.seen).toBe(true);

      const inDb = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      expect(inDb?.seen).toBe(true);
    });

    it('should return 404 NOTIFICATION_NOT_FOUND for other user', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/notifications/${notificationId}/seen`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateSeenDtoSchema.parse({ seen: true }));

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
        { notificationId: String(notificationId) },
      );
    });

    it('should return 404 NOTIFICATION_NOT_FOUND for non-existent notification', async () => {
      const response = await request(getHttpTarget())
        .patch(`/api/v0/notifications/999999/seen`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateSeenDtoSchema.parse({ seen: true }));

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
        { notificationId: '999999' },
      );
    });
  });

  describeInternal('Real-time Notifications (SSE)', () => {
    it('should receive a notification via SSE when one is created', async () =>
      new Promise<void>((resolve, reject) => {
        let eventReceived = false;

        const req = request(getHttpTarget())
          .get(`/api/v0/sse/stream?token=${user1Token}`)
          .expect(HttpStatus.OK)
          .expect('Content-Type', /text\/event-stream/)
          .buffer(false)
          .parse((res: request.Response) => {
            const stream = res as request.Response & http.IncomingMessage;
            stream.on('data', (chunk: Buffer) => {
              const text = chunk.toString();

              if (text.trim() === '') return;

              try {
                expect(text).toContain('event: notification');
                expect(text).toContain(
                  '"code":"BUDGET_ALLOCATION_OVERFLOW_ATTEMPT"',
                );

                eventReceived = true;
                stream.destroy();
                resolve();
              } catch (e) {
                stream.destroy();
                reject(e instanceof Error ? e : new Error(String(e)));
              }
            });
          });

        req.end((err) => {
          if (err && !eventReceived)
            reject(err instanceof Error ? err : new Error(String(err)));
        });

        setTimeout(() => {
          notificationService!
            .create(
              user1Id,
              NotificationType.WARNING,
              'BUDGET_ALLOCATION_OVERFLOW_ATTEMPT',
              {
                transactionId: '1',
                categoryName: 'General',
                availableAmount: '1000',
                requestedAmount: '1500',
                attemptedBy: 'Admin',
              },
            )
            .catch(reject);
        }, 150);
      }));
  });
});
