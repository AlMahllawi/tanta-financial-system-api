import { HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { UserRole } from '../prisma/generated/enums.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser } from './utils.js';

describe('LookupController (e2e)', () => {
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    await bootstrapApp();
    prisma = getPrisma();

    await clearDatabase(prisma);
    const user = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.ADMIN,
    );
    token = user.token;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('GET /lookups', () => {
    it('should return all system constants and dropdown values with a 200 status', async () => {
      const response = await request(getHttpTarget())
        .get('/api/lookups')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HttpStatus.OK);

      expect(response.body).toMatchObject({
        UserRole: expect.any(Array),
        TransactionPriority: expect.any(Array),
        TransactionForwardStatus: expect.any(Array),
      });
    });
  });
});
