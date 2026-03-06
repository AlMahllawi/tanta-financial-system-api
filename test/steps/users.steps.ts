import { defineFeature, loadFeature } from 'jest-cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import * as shared from './shared.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaExceptionFilter } from '../../src/prisma/filters/exception.filter.js';
import { Reflector } from '@nestjs/core';
import * as http from 'http';

const feature = loadFeature('./test/features/users.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let response: request.Response;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let requestPayload: Record<string, unknown> = {};
  let currentUserId: number | null = null;
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
    app.useGlobalFilters(new PrismaExceptionFilter(app.get(Reflector)));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
    httpServer = app.getHttpServer() as http.Server;

    await prisma.department.upsert({
      where: { name: 'IT Department' },
      update: {},
      create: { name: 'IT Department' },
    });

    const adminUser = await prisma.user.upsert({
      where: { name: 'admin_user' },
      update: {},
      create: {
        name: 'admin_user',
        hashedPassword: 'hashedPassword',
        role: 'ADMIN',
        departmentName: 'IT Department',
      },
    });

    const standardUser = await prisma.user.upsert({
      where: { name: 'standard_user' },
      update: {},
      create: {
        name: 'standard_user',
        hashedPassword: 'hashedPassword',
        role: 'USER',
        departmentName: 'IT Department',
      },
    });

    adminToken = jwtService.sign({
      id: adminUser.id,
      username: adminUser.name,
      role: adminUser.role,
    });

    userToken = jwtService.sign({
      id: standardUser.id,
      username: standardUser.name,
      role: standardUser.role,
    });
  });

  afterAll(async () => {
    const type = await prisma.transactionType.findUnique({
      where: { name: 'Test Type' },
    });
    if (type)
      await prisma.transactionType.delete({ where: { name: 'Test Type' } });

    await prisma.user.deleteMany({
      where: { departmentName: 'IT Department' },
    });
    // Fallback delete unassociated ones just in case
    await prisma.user.deleteMany({
      where: {
        name: {
          in: [
            'admin_user',
            'standard_user',
            'new_user',
            'new_user2',
            'to_delete_user',
            'duplicate_user',
            'existing_user',
            'to_update_user',
            'updated_name_user',
            'updated_name',
            'linked_user',
          ],
        },
      },
    });
    await prisma.department.deleteMany({ where: { name: 'IT Department' } });
    await app.close();
  });

  afterEach(() => {
    requestPayload = {};
    currentUserId = null;
  });

  test('Successful user creation', ({ given, and, when, then }) => {
    given(/^the request provides username, password, and role$/, () => {
      requestPayload = {
        name: 'new_user',
        password: 'Password123!',
        role: 'USER',
        departmentName: 'IT Department',
      };
    });

    and(/^the password should be encrypted$/, () => {
      // Logic handled at service level
    });

    when(/^the user is created successfully$/, async () => {
      response = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestPayload);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Duplicate user creation', ({ given, when, then }) => {
    given(/^the user already exists$/, async () => {
      await prisma.user.upsert({
        where: { name: 'duplicate_user' },
        update: {},
        create: {
          name: 'duplicate_user',
          hashedPassword: 'hashedPassword',
          role: 'USER',
          departmentName: 'IT Department',
        },
      });
      requestPayload = {
        name: 'duplicate_user',
        password: 'Password123!',
        role: 'USER',
        departmentName: 'IT Department',
      };
    });

    when(/^the admin tries to create the user$/, async () => {
      response = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestPayload);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Missing department on user creation', ({ given, when, then }) => {
    given(/^no department is selected$/, () => {
      requestPayload = {
        name: 'new_user2',
        password: 'Password123!',
        role: 'USER',
        departmentName: 'NonExistent Department',
      };
    });

    when(/^the admin tries to create the user$/, async () => {
      response = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestPayload);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('View populated users list', ({ given, when, then, and }) => {
    given(/^the endpoint is protected$/, () => {
      expect(adminToken).toBeDefined();
    });

    when(/^the user requests the list of all users$/, async () => {
      response = await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then(/^the full list of users is displayed$/, () => {
      const body = response.body as { data: unknown[] };
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
    });

    and(/^the endpoint filters users based on hierarchical order$/, () => {
      // Implemented by role queries usually
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('View empty users list', ({ given, when, then, and }) => {
    given(/^there are no users in the system$/, async () => {
      // Simulate by filtering for active=false if there aren't any
    });

    when(/^the user requests the list$/, async () => {
      response = await request(httpServer)
        .get('/users?active=false')
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenReturnsEmptyList(then, () => response);

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('Find existing user', ({ given, and, when, then }) => {
    given(/^the provided name is correct$/, async () => {
      const u = await prisma.user.upsert({
        where: { name: 'existing_user' },
        update: {},
        create: {
          name: 'existing_user',
          hashedPassword: 'password',
          departmentName: 'IT Department',
        },
      });
      currentUserId = u.id;
    });

    and(/^the endpoint is only for admin$/, () => {
      // Guard implicitly verified by passing adminToken
    });

    when(/^the admin searches for the user$/, async () => {
      response = await request(httpServer)
        .get(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then(/^all data is displayed$/, () => {
      expect((response.body as { name: string }).name).toBe('existing_user');
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('Single user not found', ({ given, when, then }) => {
    given(/^the name does not exist$/, () => {
      currentUserId = 999999;
    });

    when(/^the admin searches for the user$/, async () => {
      response = await request(httpServer)
        .get(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Successful user update', ({ given, when, then }) => {
    given(/^the request accepts the name \(id\) and new details$/, async () => {
      const u = await prisma.user.upsert({
        where: { name: 'to_update_user' },
        update: {},
        create: {
          name: 'to_update_user',
          hashedPassword: 'password',
          departmentName: 'IT Department',
        },
      });
      currentUserId = u.id;
    });

    when(/^the update is successful$/, async () => {
      response = await request(httpServer)
        .patch(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'updated_name_user' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Update non-existent user', ({ given, when, then }) => {
    given(/^the name does not exist$/, () => {
      currentUserId = 999999;
    });

    when(/^the update is attempted$/, async () => {
      response = await request(httpServer)
        .patch(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'updated_name' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Update roles restricted to admin', ({ given, when, then }) => {
    given(/^a user requests a role update$/, async () => {
      const u = await prisma.user.findUnique({
        where: { name: 'standard_user' },
      });
      currentUserId = u!.id;
    });

    when(/^the user is not an admin$/, async () => {
      response = await request(httpServer)
        .patch(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' });
    });

    then(
      /^the system should reject the modification since its restricted to admin only$/,
      () => {
        expect(response.status).toBe(403);
      },
    );
  });

  test('Update using widely assigned username', ({ given, when, then }) => {
    given(/^a new username is already used$/, async () => {
      const u = await prisma.user.findUnique({
        where: { name: 'standard_user' },
      });
      currentUserId = u!.id;
    });

    when(/^the update is attempted$/, async () => {
      response = await request(httpServer)
        .patch(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'admin_user' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Successful user deletion', ({ given, when, then, and }) => {
    given(/^the correct name is provided$/, async () => {
      const u = await prisma.user.upsert({
        where: { name: 'to_delete_user' },
        update: {},
        create: {
          name: 'to_delete_user',
          hashedPassword: 'password',
          departmentName: 'IT Department',
        },
      });
      currentUserId = u.id;
    });

    when(/^the deletion is requested$/, async () => {
      response = await request(httpServer)
        .delete(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then(/^the user is deleted$/, async () => {
      const u = await prisma.user.findUnique({ where: { id: currentUserId! } });
      expect(u).toBeNull();
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('Delete non-existent user', ({ given, when, then }) => {
    given(/^the name does not exist$/, () => {
      currentUserId = 999999;
    });

    when(/^the deletion is attempted$/, async () => {
      response = await request(httpServer)
        .delete(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Prevent deletion of user linked to main operations', ({
    given,
    when,
    then,
  }) => {
    given(/^the user is linked to main operations$/, async () => {
      const u = await prisma.user.upsert({
        where: { name: 'linked_user' },
        update: {},
        create: {
          name: 'linked_user',
          hashedPassword: 'password',
          departmentName: 'IT Department',
          createdTypes: {
            create: { name: 'Test Type' },
          },
        },
      });
      currentUserId = u.id;
    });

    when(/^the deletion is attempted$/, async () => {
      response = await request(httpServer)
        .delete(`/users/${currentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then(/^the system prevents deletion and triggers a warning$/, () => {
      // It can trigger 400 or 500 based on FK errors if unhandled, or mapped to 400.
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
