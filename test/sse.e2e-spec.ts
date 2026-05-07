import { HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as http from 'http';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  bootstrapApp,
  describeInternal,
  getHttpTarget,
  getModule,
  getPrisma,
  isExternalMode,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser } from './utils.js';

describe('SSE (e2e)', () => {
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2 | null = null;

  beforeAll(async () => {
    await bootstrapApp({ withValidationPipe: false });
    prisma = getPrisma();

    if (!isExternalMode())
      eventEmitter = getModule().get<EventEmitter2>(EventEmitter2);

    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('GET /sse/stream', () => {
    it('should return 401 if unauthorized', async () => {
      await request(getHttpTarget())
        .get('/api/v0/sse/stream')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    describeInternal('Internal SSE events', () => {
      it('should connect to SSE and receive events', async () => {
        const { user, token } = await createTestUser(prisma, getHttpTarget());

        return new Promise<void>((resolve, reject) => {
          let eventReceived = false;

          const req = request(getHttpTarget())
            .get(`/api/v0/sse/stream?token=${token}`)
            .expect(HttpStatus.OK)
            .expect('Content-Type', /text\/event-stream/)
            .buffer(false)
            .parse((res: request.Response) => {
              const stream = res as request.Response & http.IncomingMessage;
              stream.on('data', (chunk: Buffer) => {
                const text = chunk.toString();

                // Ignore keep-alive or empty lines
                if (text.trim() === '') return;

                try {
                  expect(text).toContain('event: test-event');
                  expect(text).toContain('data: test-data');

                  eventReceived = true;
                  stream.destroy(); // Close the connection to prevent hanging
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

          // Emit an event shortly after connection
          setTimeout(() => {
            eventEmitter!.emit(`sse.user.${user.id}`, {
              type: 'test-event',
              data: 'test-data',
            });
          }, 150);
        });
      });

      it('should set user to ONLINE when connected and OFFLINE when disconnected', async () => {
        const { user, token } = await createTestUser(prisma, getHttpTarget());

        // User should be offline initially
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        expect(updatedUser?.presence).toBe('OFFLINE');

        return new Promise<void>((resolve, reject) => {
          const req = request(getHttpTarget())
            .get(`/api/v0/sse/stream?token=${token}`)
            .expect(HttpStatus.OK)
            .buffer(false)
            .parse((res: request.Response) => {
              const stream = res as request.Response & http.IncomingMessage;

              // Check that user is ONLINE after connection
              setTimeout(() => {
                prisma.user
                  .findUnique({
                    where: { id: user.id },
                  })
                  .then((userOpt) => {
                    expect(userOpt?.presence).toBe('ONLINE');
                    stream.destroy(); // Disconnect
                  })
                  .catch((e) => {
                    stream.destroy();
                    reject(e instanceof Error ? e : new Error(String(e)));
                  });
              }, 150);

              // Check that user is OFFLINE after disconnection
              stream.on('close', () => {
                setTimeout(() => {
                  prisma.user
                    .findUnique({
                      where: { id: user.id },
                    })
                    .then((userOpt) => {
                      expect(userOpt?.presence).toBe('OFFLINE');
                      resolve();
                    })
                    .catch((e) => {
                      reject(e instanceof Error ? e : new Error(String(e)));
                    });
                }, 150);
              });
            });

          req.end(() => {
            // ignore error related to premature close since we manually destroy the stream
          });
        });
      });
    });
  });
});
