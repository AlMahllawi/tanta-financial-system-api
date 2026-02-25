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

const feature = loadFeature('./test/features/departments.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let response: request.Response;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let requestPayload: Record<string, unknown> = {};
  let httpServer: http.Server;
  let currentDeptName: string | null = null;

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
      where: { name: 'Admin Dept' },
      update: {},
      create: { name: 'Admin Dept' },
    });

    const adminUser = await prisma.user.upsert({
      where: { name: 'dept_admin' },
      update: {},
      create: {
        name: 'dept_admin',
        hashedPassword: 'hashedPassword',
        role: 'ADMIN',
        departmentName: 'Admin Dept',
      },
    });

    const standardUser = await prisma.user.upsert({
      where: { name: 'dept_standard' },
      update: {},
      create: {
        name: 'dept_standard',
        hashedPassword: 'hashedPassword',
        role: 'USER',
        departmentName: 'Admin Dept',
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
    const depts = [
      'Admin Dept',
      'New Department',
      'Duplicate Dept',
      'Existing Dept',
      'Old Dept',
      'Updated Dept',
      'Target Dept',
      'To Delete Dept',
      'Linked Dept',
      'Busy Dept',
      'Other Dept',
      'Manager Dept',
      'Second Manager Dept',
    ];
    await prisma.department.updateMany({
      where: { name: { in: depts } },
      data: { managerId: null },
    });
    for (const d of depts) {
      await prisma.user.deleteMany({ where: { departmentName: d } });
    }
    await prisma.user.deleteMany({
      where: {
        name: {
          in: [
            'dept_admin',
            'dept_standard',
            'busy_manager',
            'other_dept_user',
            'linked_user',
          ],
        },
      },
    });
    await prisma.department.deleteMany({
      where: { name: { in: depts } },
    });
    await app.close();
  });

  afterEach(() => {
    requestPayload = {};

    currentDeptName = null;
  });

  test('Create a valid department', ({ given, when, then, and }) => {
    given('the request contains a valid department name', () => {
      requestPayload = { name: 'New Department' };
    });

    when('the department is created', async () => {
      response = await request(httpServer)
        .post('/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestPayload);
    });

    then('it appears in the departments list', () => {
      expect((response.body as { name: string }).name).toBe('New Department');
    });

    and('the system returns response 201 upon success', () => {
      expect(response.status).toBe(201);
    });
  });

  test('Prevent duplicate department name', ({ given, when, then, and }) => {
    given('a department already exists with the same name', async () => {
      await prisma.department.upsert({
        where: { name: 'Duplicate Dept' },
        update: {},
        create: { name: 'Duplicate Dept' },
      });
      requestPayload = { name: 'Duplicate Dept' };
    });

    when(
      'a request is made to create a department with the same name',
      async () => {
        response = await request(httpServer)
          .post('/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(requestPayload);
      },
    );

    then('the system prevents the creation', () => {
      // Empty logic as it maps to status check below
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('View populated departments list', ({ given, when, then, and }) => {
    given('there are existing departments', () => {
      // Covered by beforeAll setup
    });

    when('the user requests to view all departments', async () => {
      response = await request(httpServer)
        .get('/departments')
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then('all departments are displayed as a list', () => {
      const body = response.body as { data: unknown[] };
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('Find existing department by name', ({ given, when, then, and }) => {
    given('the user provides a correct department name', async () => {
      const d = await prisma.department.upsert({
        where: { name: 'Existing Dept' },
        update: {},
        create: { name: 'Existing Dept' },
      });
      currentDeptName = d.name;
    });

    when('the system searches for the department', async () => {
      response = await request(httpServer)
        .get(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then('the department and its details are displayed', () => {
      expect((response.body as { name: string }).name).toBe('Existing Dept');
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  test('Department not found', ({ given, when, then }) => {
    given('the user provides a name that does not exist', () => {
      currentDeptName = 'does-not-exist-123';
    });

    when('the system searches for the department', async () => {
      response = await request(httpServer)
        .get(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Update existing department', ({ given, when, then }) => {
    given(
      'the request contains the old department name and update details',
      async () => {
        const d = await prisma.department.upsert({
          where: { name: 'Old Dept' },
          update: {},
          create: { name: 'Old Dept' },
        });
        currentDeptName = d.name;
      },
    );

    when('the update is processed successfully', async () => {
      response = await request(httpServer)
        .patch(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Dept' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Update non-existent department', ({ given, when, then }) => {
    given('the department does not exist', () => {
      currentDeptName = 'does-not-exist-123';
    });

    when('the admin attempts an update', async () => {
      response = await request(httpServer)
        .patch(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Target Dept' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Update to an already existing name', ({ given, when, then }) => {
    given('the new name already exists', async () => {
      await prisma.department.upsert({
        where: { name: 'Target Dept' },
        update: {},
        create: { name: 'Target Dept' },
      });
      const d = await prisma.department.upsert({
        where: { name: 'Admin Dept' },
        update: {},
        create: { name: 'Admin Dept' },
      });
      currentDeptName = d.name;
    });

    when('the admin attempts an update', async () => {
      response = await request(httpServer)
        .patch(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Target Dept' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Successful department deletion', ({ given, when, then }) => {
    given(
      'the department exists and delete is requested using its name',
      async () => {
        const d = await prisma.department.upsert({
          where: { name: 'To Delete Dept' },
          update: {},
          create: { name: 'To Delete Dept' },
        });
        currentDeptName = d.name;
      },
    );

    when('the deletion is successful', async () => {
      response = await request(httpServer)
        .delete(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Deleting a department linked to transactions', ({
    given,
    when,
    then,
  }) => {
    given(
      'the department is used in other actual and past transactions',
      async () => {
        const d = await prisma.department.upsert({
          where: { name: 'Linked Dept' },
          update: {},
          create: { name: 'Linked Dept' },
        });
        currentDeptName = d.name;
        await prisma.user.upsert({
          where: { name: 'linked_user' },
          update: { departmentName: 'Linked Dept' },
          create: {
            name: 'linked_user',
            hashedPassword: 'password',
            role: 'USER',
            departmentName: 'Linked Dept',
          },
        });
      },
    );

    when('the admin attempts a deletion', async () => {
      response = await request(httpServer)
        .delete(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then(
      'the system prevents the deletion and asks for permission or triggers alert',
      () => {
        expect(response.status).toBeGreaterThanOrEqual(400);
      },
    );
  });

  test('Delete non-existent department', ({ given, when, then }) => {
    given('the name does not exist', () => {
      currentDeptName = 'does-not-exist-123';
    });

    when('the admin attempts a deletion', async () => {
      response = await request(httpServer)
        .delete(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Manager user not found', ({ given, when, then }) => {
    given('the request assigns a manager to the department', async () => {
      const d = await prisma.department.upsert({
        where: { name: 'Manager Dept' },
        update: {},
        create: { name: 'Manager Dept' },
      });
      currentDeptName = d.name;
    });

    when('the manager user ID does not exist', async () => {
      response = await request(httpServer)
        .patch(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ managerId: 999999 });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Manager already assigned to a department', ({ given, when, then }) => {
    given(
      'the assigned manager already manages another department',
      async () => {
        await prisma.department.upsert({
          where: { name: 'Busy Dept' },
          update: {},
          create: { name: 'Busy Dept' },
        });
        const u = await prisma.user.upsert({
          where: { name: 'busy_manager' },
          update: {},
          create: {
            name: 'busy_manager',
            hashedPassword: 'password',
            departmentName: 'Busy Dept',
          },
        });
        await prisma.department.update({
          where: { name: 'Busy Dept' },
          data: { managerId: u.id },
        });
        const d = await prisma.department.upsert({
          where: { name: 'Second Manager Dept' },
          update: {},
          create: { name: 'Second Manager Dept' },
        });
        currentDeptName = d.name;
        requestPayload = { managerId: u.id };
      },
    );

    when('the update is attempted', async () => {
      response = await request(httpServer)
        .patch(`/departments/${encodeURIComponent(currentDeptName!)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestPayload);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Manager is not a member of the department', ({ given, when, then }) => {
    given(
      'the assigned manager does not belong to this department',
      async () => {
        await prisma.department.upsert({
          where: { name: 'Other Dept' },
          update: {},
          create: { name: 'Other Dept' },
        });
        const u = await prisma.user.upsert({
          where: { name: 'other_dept_user' },
          update: {},
          create: {
            name: 'other_dept_user',
            hashedPassword: 'password',
            departmentName: 'Other Dept',
          },
        });
        await prisma.department.upsert({
          where: { name: 'Admin Dept' },
          update: {},
          create: { name: 'Admin Dept' },
        });
        currentDeptName = (await prisma.department.findUnique({
          where: { name: 'Admin Dept' },
        }))!.name;
        requestPayload = { managerId: u.id };
      },
    );

    when('the update is attempted', async () => {
      response = await request(httpServer)
        .patch(`/departments/${currentDeptName}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestPayload);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  test('Prevent non-admin user from managing departments', ({
    given,
    when,
    then,
  }) => {
    given('a regular user is logged in', () => {
      // Covered by userToken
    });

    when('the user attempts to create a department', async () => {
      response = await request(httpServer)
        .post('/departments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Unauthorized Dept' });
    });

    shared.thenSystemReturnsStatus(then, () => response);

    when('the user attempts to update a department', async () => {
      response = await request(httpServer)
        .patch('/departments/Admin%20Dept')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hack Dept' });
    });

    shared.thenSystemReturnsStatus(then, () => response);

    when('the user attempts to delete a department', async () => {
      response = await request(httpServer)
        .delete('/departments/Admin%20Dept')
        .set('Authorization', `Bearer ${userToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });
});
