import { defineFeature, loadFeature, DefineStepFunction } from 'jest-cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';

interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
  };
}

const feature = loadFeature('./test/features/pagination.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let response: request.Response;
  let transactionId: number;
  let responseBody: PaginatedResponse;
  let httpServer: http.Server;

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
    httpServer = app.getHttpServer() as http.Server;

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
    if (transactionId) {
      await prisma.transactionForward.deleteMany({ where: { transactionId } });
      await prisma.transaction.delete({ where: { id: transactionId } });
    }
    await prisma.transaction.deleteMany({
      where: { title: { startsWith: 'Paginated Trans ' } },
    });
    await prisma.transactionType.deleteMany({
      where: { name: { startsWith: 'Pagination Type ' } },
    });
    await prisma.transactionType.deleteMany({
      where: { name: 'Forward Pagination Type' },
    });
    await prisma.transactionType.deleteMany({
      where: { name: 'Pagination Trans Type' },
    });
    await prisma.user.deleteMany({
      where: { name: { startsWith: 'Pagination User ' } },
    });
    await prisma.department.deleteMany({
      where: { name: { startsWith: 'Pagination Dept ' } },
    });
    await prisma.user.deleteMany({ where: { name: 'pagination_test_user' } });
    await prisma.department.deleteMany({ where: { name: 'Pagination Dept' } });
    await app.close();
  });

  // Shared Steps
  const givenUserIsAuthenticated = (given: DefineStepFunction) => {
    given(/^the user is authenticated$/, () => {
      expect(authToken).toBeDefined();
    });
  };

  const thenSystemReturnsResponse = (then: DefineStepFunction) => {
    then(/^the system returns response (\d+)$/, (status: string) => {
      expect(response.status).toBe(parseInt(status, 10));
      responseBody = response.body as PaginatedResponse;
    });
  };

  const andPaginatedDataContainsUpToItems = (and: DefineStepFunction) => {
    and(
      /^the paginated .* data contains up to (\d+) items$/,
      (count: string) => {
        expect(responseBody.data).toBeInstanceOf(Array);
        expect(responseBody.data.length).toBeLessThanOrEqual(
          parseInt(count, 10),
        );
      },
    );
  };

  const andPaginatedDataContainsItems = (and: DefineStepFunction) => {
    and(/^the paginated .* data contains (\d+) items$/, (count: string) => {
      expect(responseBody.data).toBeInstanceOf(Array);
      expect(responseBody.data.length).toBe(parseInt(count, 10));
    });
  };

  const andPaginationMetadataShowsPageAndPerPage = (
    and: DefineStepFunction,
  ) => {
    and(
      /^the .* pagination metadata shows page (\d+) and perPage (\d+)$/,
      (page: string, perPage: string) => {
        expect(responseBody.pagination).toBeDefined();
        expect(responseBody.pagination.currentPage).toBe(parseInt(page, 10));
        expect(responseBody.pagination.perPage).toBe(parseInt(perPage, 10));
      },
    );
  };

  const andPaginationMetadataShowsPerPage = (and: DefineStepFunction) => {
    and(
      /^the .* pagination metadata shows perPage (\d+)$/,
      (perPage: string) => {
        expect(responseBody.pagination.perPage).toBe(parseInt(perPage, 10));
      },
    );
  };

  const andPaginationTotalCountIsAtLeast = (and: DefineStepFunction) => {
    and(/^the .* total count is at least (\d+)$/, (total: string) => {
      expect(responseBody.pagination.total).toBeGreaterThanOrEqual(
        parseInt(total, 10),
      );
    });
  };

  test('Department Pagination with default limits', ({
    given,
    and,
    when,
    then,
  }) => {
    givenUserIsAuthenticated(given);

    and(/^there are 15 seeded departments$/, async () => {
      await prisma.department.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `Pagination Dept ${i}`,
        })),
        skipDuplicates: true,
      });
    });

    when(
      /^the user requests departments with default pagination$/,
      async () => {
        response = await request(httpServer)
          .get('/departments')
          .set('Authorization', `Bearer ${authToken}`);
      },
    );

    thenSystemReturnsResponse(then);
    andPaginatedDataContainsUpToItems(and);
    andPaginationMetadataShowsPageAndPerPage(and);
  });

  test('Department Pagination with specific limits', ({
    given,
    and,
    when,
    then,
  }) => {
    givenUserIsAuthenticated(given);

    and(/^there are 15 seeded departments$/, () => {
      // Handled by previous step or available in DB
    });

    when(/^the user requests departments page 2 with limit 5$/, async () => {
      response = await request(httpServer)
        .get('/departments?page=2&perPage=5')
        .set('Authorization', `Bearer ${authToken}`);
    });

    thenSystemReturnsResponse(then);
    andPaginatedDataContainsItems(and);
    andPaginationMetadataShowsPageAndPerPage(and);
  });

  test('User Pagination', ({ given, and, when, then }) => {
    givenUserIsAuthenticated(given);

    and(/^there are 15 seeded users$/, async () => {
      await prisma.user.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `Pagination User ${i}`,
          hashedPassword: 'password',
          departmentName: 'Pagination Dept',
        })),
        skipDuplicates: true,
      });
    });

    when(/^the user requests users page 1 with limit 5$/, async () => {
      response = await request(httpServer)
        .get('/users?page=1&perPage=5')
        .set('Authorization', `Bearer ${authToken}`);
    });

    thenSystemReturnsResponse(then);
    andPaginatedDataContainsItems(and);
    andPaginationTotalCountIsAtLeast(and);
  });

  test('Transaction Type Pagination', ({ given, and, when, then }) => {
    givenUserIsAuthenticated(given);

    and(/^there are 15 seeded transaction types$/, async () => {
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

    when(
      /^the user requests transaction types page 1 with limit 5$/,
      async () => {
        response = await request(httpServer)
          .get('/transactions/types?page=1&perPage=5')
          .set('Authorization', `Bearer ${authToken}`);
      },
    );

    thenSystemReturnsResponse(then);
    andPaginatedDataContainsItems(and);
    andPaginationMetadataShowsPerPage(and);
  });

  test('Transaction Forward Pagination', ({ given, and, when, then }) => {
    givenUserIsAuthenticated(given);

    and(/^there is a transaction with 15 forwards$/, async () => {
      const user = await prisma.user.findFirst({
        where: { name: 'pagination_test_user' },
      });

      const type = await prisma.transactionType.upsert({
        where: { name: 'Forward Pagination Type' },
        update: {},
        create: { name: 'Forward Pagination Type', creatorId: user!.id },
      });

      const transaction = await prisma.transaction.create({
        data: {
          title: 'Forward Pagination Transaction',
          description: 'Desc',
          typeName: type.name,
          creatorId: user!.id,
        },
      });
      transactionId = transaction.id;

      await prisma.transactionForward.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          transactionId: transaction.id,
          senderId: user!.id,
          receiverId: user!.id,
          status: 'WAITING',
          senderComment: `Comment ${i}`,
        })),
      });
    });

    when(
      /^the user requests transaction forwards page 1 with limit 5$/,
      async () => {
        response = await request(httpServer)
          .get(`/transaction/${transactionId}/forward?page=1&perPage=5`)
          .set('Authorization', `Bearer ${authToken}`);
      },
    );

    thenSystemReturnsResponse(then);
    andPaginatedDataContainsItems(and);
    andPaginationTotalCountIsAtLeast(and);
    andPaginationMetadataShowsPerPage(and);
  });

  test('Transaction Pagination', ({ given, and, when, then }) => {
    givenUserIsAuthenticated(given);

    and(/^there are 15 seeded transactions$/, async () => {
      const user = await prisma.user.findFirst({
        where: { name: 'pagination_test_user' },
      });

      const type = await prisma.transactionType.upsert({
        where: { name: 'Pagination Trans Type' },
        update: {},
        create: { name: 'Pagination Trans Type', creatorId: user!.id },
      });

      await prisma.transaction.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          title: `Paginated Trans ${i}`,
          description: 'Desc',
          typeName: type.name,
          creatorId: user!.id,
        })),
        skipDuplicates: true,
      });
    });

    when(
      /^the user requests transactions query "all" page 1 with limit 5$/,
      async () => {
        response = await request(httpServer)
          .get('/transactions?query=all&page=1&perPage=5')
          .set('Authorization', `Bearer ${authToken}`);
      },
    );

    thenSystemReturnsResponse(then);
    andPaginatedDataContainsItems(and);
    andPaginationTotalCountIsAtLeast(and);
    andPaginationMetadataShowsPerPage(and);
  });
});
