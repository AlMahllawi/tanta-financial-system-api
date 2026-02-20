import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Pagination (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'JWT_SECRET') return 'test-secret';
          if (key === 'JWT_EXPIRATION') return '1d';
          return null;
        },
        getOrThrow: (key: string) => {
          if (key === 'JWT_SECRET') return 'test-secret';
          if (key === 'JWT_EXPIRATION') return '1d';
          throw new Error(`Config key ${key} not found`);
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Create a test user and generate token
    const testUser = await prisma.user.upsert({
      where: { name: 'pagination_test_user' },
      update: {},
      create: {
        name: 'pagination_test_user',
        hashedPassword: 'hashedPassword',
        role: 'ADMIN',
        department: {
          create: { name: 'Pagination Dept' },
        },
      },
    });

    authToken = jwtService.sign({
      id: testUser.id,
      username: testUser.name,
      role: testUser.role,
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({ where: { name: 'pagination_test_user' } });
    await prisma.department.deleteMany({ where: { name: 'Pagination Dept' } });
    await app.close();
  });

  describe('Department Pagination', () => {
    beforeAll(async () => {
      // Seed departments
      await prisma.department.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `Pagination Dept ${i}`,
        })),
        skipDuplicates: true,
      });
    });

    afterAll(async () => {
      await prisma.department.deleteMany({
        where: { name: { startsWith: 'Pagination Dept ' } },
      });
    });

    it('should return default paginated results (page 1, limit 10)', () => {
      return request(app.getHttpServer())
        .get('/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBeLessThanOrEqual(10);
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.currentPage).toBe(1);
          expect(res.body.meta.perPage).toBe(10);
        });
    });

    it('should return specific page and limit', () => {
      return request(app.getHttpServer())
        .get('/departments?page=2&perPage=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(5);
          expect(res.body.meta.currentPage).toBe(2);
          expect(res.body.meta.perPage).toBe(5);
        });
    });
  });

  describe('User Pagination', () => {
    beforeAll(async () => {
      // Seed users
      await prisma.user.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `Pagination User ${i}`,
          hashedPassword: 'password',
          departmentName: 'Pagination Dept',
        })),
        skipDuplicates: true,
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { name: { startsWith: 'Pagination User ' } },
      });
    });

    it('should paginate users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(5);
          expect(res.body.meta.total).toBeGreaterThanOrEqual(15);
        });
    });
  });

  describe('Transaction Type Pagination', () => {
    beforeAll(async () => {
      // Seed transaction types
      const user = await prisma.user.findFirst({
        where: { name: 'pagination_test_user' },
      });
      await prisma.transactionType.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `Pagination Type ${i}`,
          creatorId: user!.id,
        })),
        skipDuplicates: true,
      });
    });

    afterAll(async () => {
      await prisma.transactionType.deleteMany({
        where: { name: { startsWith: 'Pagination Type ' } },
      });
    });

    it('should paginate transaction types', () => {
      return request(app.getHttpServer())
        .get('/transactions/types?page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(5);
          expect(res.body.meta.perPage).toBe(5);
        });
    });
  });

  describe('Transaction Forward Pagination', () => {
    let transactionId: number;

    beforeAll(async () => {
      const user = await prisma.user.findFirst({
        where: { name: 'pagination_test_user' },
      });

      // Create a transaction type first if not exists (reused from previous test or create new)
      const type = await prisma.transactionType.upsert({
        where: { name: 'Forward Pagination Type' },
        update: {},
        create: { name: 'Forward Pagination Type', creatorId: user!.id },
      });

      // Create a transaction
      const transaction = await prisma.transaction.create({
        data: {
          title: 'Forward Pagination Transaction',
          description: 'Desc',
          typeName: type.name,
          creatorId: user!.id,
        },
      });
      transactionId = transaction.id;

      // Seed forwards
      // Allowed: creator can create first forward.
      // Subsequent forwards must be by receiver.
      // Simulating many forwards on ONE transaction is tricky because they are sequential in logic (linked list effectively),
      // but the data model allows multiple forwards for a transaction ID in the database (one-to-many).
      // The `findAll` endpoint returns all forwards for a transaction.
      // We can just create them in DB directly skipping logic checks for seeding purposes.

      await prisma.transactionForward.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          transactionId: transaction.id,
          senderId: user!.id,
          receiverId: user!.id, // self forward for simplicity
          status: 'WAITING',
          senderComment: `Comment ${i}`,
        })),
      });
    });

    afterAll(async () => {
      await prisma.transactionForward.deleteMany({ where: { transactionId } });
      await prisma.transaction.delete({ where: { id: transactionId } });
      await prisma.transactionType.deleteMany({
        where: { name: 'Forward Pagination Type' },
      });
    });

    it('should paginate transaction forwards', () => {
      return request(app.getHttpServer())
        .get(`/transaction/${transactionId}/forward?page=1&perPage=5`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(5);
          expect(res.body.meta.perPage).toBe(5);
          expect(res.body.meta.total).toBeGreaterThanOrEqual(15);
        });
    });
  });

  describe('Transaction Pagination', () => {
    beforeAll(async () => {
      const user = await prisma.user.findFirst({
        where: { name: 'pagination_test_user' },
      });
      // Ensure user exists before using it
      if (!user) throw new Error('Test user not found');

      const type = await prisma.transactionType.upsert({
        where: { name: 'Pagination Trans Type' },
        update: {},
        create: { name: 'Pagination Trans Type', creatorId: user.id },
      });

      // Seed transactions
      await prisma.transaction.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          title: `Paginated Trans ${i}`,
          description: 'Desc',
          typeName: type.name,
          creatorId: user.id,
        })),
        skipDuplicates: true,
      });
    });

    afterAll(async () => {
      await prisma.transaction.deleteMany({
        where: { title: { startsWith: 'Paginated Trans ' } },
      });
      await prisma.transactionType.deleteMany({
        where: { name: 'Pagination Trans Type' },
      });
    });

    it('should paginate transactions', () => {
      return request(app.getHttpServer())
        .get('/transactions?query=all&page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(5);
          expect(res.body.meta.perPage).toBe(5);
          expect(res.body.meta.total).toBeGreaterThanOrEqual(15);
        });
    });
  });
});
