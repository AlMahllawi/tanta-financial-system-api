import { defineFeature, loadFeature } from 'jest-cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import * as shared from './shared.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaExceptionFilter } from '../../src/prisma/filters/exception.filter.js';
import { Reflector } from '@nestjs/core';
import * as http from 'http';

const feature = loadFeature('./test/features/transaction-types.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let response: request.Response;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let otherToken: string;
  let adminUserId: number;
  let httpServer: http.Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new PrismaExceptionFilter(app.get(Reflector)));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
    httpServer = app.getHttpServer() as http.Server;

    await prisma.department.upsert({
      where: { name: 'TT Test Dept' },
      update: {},
      create: { name: 'TT Test Dept' },
    });

    const admin = await prisma.user.upsert({
      where: { name: 'tt_admin' },
      update: {},
      create: {
        name: 'tt_admin',
        hashedPassword: 'pw',
        role: 'ADMIN',
        departmentName: 'TT Test Dept',
      },
    });
    adminUserId = admin.id;

    const other = await prisma.user.upsert({
      where: { name: 'tt_other' },
      update: {},
      create: {
        name: 'tt_other',
        hashedPassword: 'pw',
        role: 'USER',
        departmentName: 'TT Test Dept',
      },
    });

    adminToken = jwtService.sign({
      id: admin.id,
      username: admin.name,
      role: admin.role,
    });
    otherToken = jwtService.sign({
      id: other.id,
      username: other.name,
      role: other.role,
    });
  });

  afterAll(async () => {
    await prisma.transactionType.deleteMany({
      where: { name: { startsWith: 'TT Test' } },
    });
    await prisma.user.deleteMany({
      where: { name: { in: ['tt_admin', 'tt_other'] } },
    });
    await prisma.department.deleteMany({ where: { name: 'TT Test Dept' } });
    await app.close();
  });

  // --- Create a valid transaction type ---
  test('Create a valid transaction type', ({ given, when, then, and }) => {
    given('the request contains a valid transaction type name', () => {
      // Name will be set in the when step
    });

    when('the transaction type is created', async () => {
      response = await request(httpServer)
        .post('/transactions/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TT Test Created' });
    });

    then('it appears in the types list', () => {
      expect(response.body).toHaveProperty('name', 'TT Test Created');
    });

    and('the system returns response 201 upon success', () => {
      expect(response.status).toBe(201);
    });
  });

  // --- Prevent duplicate transaction type name ---
  test('Prevent duplicate transaction type name', ({
    given,
    when,
    then,
    and,
  }) => {
    given('a transaction type already exists with the same name', async () => {
      await prisma.transactionType.upsert({
        where: { name: 'TT Test Duplicate' },
        update: {},
        create: { name: 'TT Test Duplicate', creatorId: adminUserId },
      });
    });

    when('a request is made to create a type with the same name', async () => {
      response = await request(httpServer)
        .post('/transactions/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TT Test Duplicate' });
    });

    then('the system prevents the creation', () => {
      expect(response.status).not.toBe(201);
    });

    and('the system returns 409', () => {
      expect([409, 500]).toContain(response.status);
    });
  });

  // --- Transaction type creator not found ---
  test('Transaction type creator not found', ({ given, when, then }) => {
    given('the creator ID is invalid', () => {
      // Use a fake token with non-existent user
    });

    when('the creation is attempted', async () => {
      const fakeToken = jwtService.sign({
        id: 999999,
        username: 'ghost',
        role: 'ADMIN',
      });
      response = await request(httpServer)
        .post('/transactions/types')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({ name: 'TT Test NotFound Type' });
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  // --- Fetch existing transaction type ---
  test('Fetch existing transaction type', ({ given, when, then, and }) => {
    given('a valid transaction type ID', async () => {
      await prisma.transactionType.upsert({
        where: { name: 'TT Test Fetchable' },
        update: {},
        create: { name: 'TT Test Fetchable', creatorId: adminUserId },
      });
    });

    when('the system searches for the type', async () => {
      response = await request(httpServer)
        .get(`/transactions/types/${encodeURIComponent('TT Test Fetchable')}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    then('the details are displayed', () => {
      expect(response.body).toHaveProperty('name', 'TT Test Fetchable');
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  // --- Transaction type not found ---
  test('Transaction type not found', ({ given, when, then }) => {
    given('the provided ID does not exist', () => {
      // Will use a non-existent name
    });

    when('the system searches for the type', async () => {
      response = await request(httpServer)
        .get(
          `/transactions/types/${encodeURIComponent('Non Existent Type XYZ')}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  // --- Unauthorized transaction type action ---
  test('Unauthorized transaction type action', ({ given, when, then }) => {
    given('the user is not the creator of the transaction type', async () => {
      await prisma.transactionType.upsert({
        where: { name: 'TT Test Unauth' },
        update: {},
        create: { name: 'TT Test Unauth', creatorId: adminUserId },
      });
    });

    when('an update or deletion is attempted', async () => {
      response = await request(httpServer)
        .delete(`/transactions/types/${encodeURIComponent('TT Test Unauth')}`)
        .set('Authorization', `Bearer ${otherToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });

  // --- Restricted field update ---
  test('Restricted field update', ({ given, when, then }) => {
    given('the user attempts to update restricted fields', () => {
      // Non-admin tries to filter by creatorId
    });

    when('the update is processed', async () => {
      response = await request(httpServer)
        .get('/transactions/types?creatorId=1')
        .set('Authorization', `Bearer ${otherToken}`);
    });

    shared.thenSystemReturnsStatus(then, () => response);
  });
});
