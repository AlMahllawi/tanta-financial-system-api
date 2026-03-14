import { defineFeature, loadFeature } from 'jest-cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import * as shared from './shared.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { hash } from 'argon2';
import * as http from 'http';

const feature = loadFeature('./test/features/auth.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let response: request.Response;
  let prisma: PrismaService;
  let httpServer: http.Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
    httpServer = app.getHttpServer() as http.Server;

    await prisma.department.upsert({
      where: { name: 'Auth Test Dept' },
      update: {},
      create: { name: 'Auth Test Dept' },
    });

    // Create a user with a properly hashed password for auth tests
    const hashed = await hash('Test1234');
    await prisma.user.upsert({
      where: { name: 'auth_testuser' },
      update: { hashedPassword: hashed },
      create: {
        name: 'auth_testuser',
        hashedPassword: hashed,
        role: 'ADMIN',
        departmentName: 'Auth Test Dept',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { name: 'auth_testuser' } });
    await prisma.department.deleteMany({ where: { name: 'Auth Test Dept' } });
    await app.close();
  });

  // --- Successful Login ---
  test('Successful Login', ({ given, when, then, and }) => {
    given('the user inputs username and password', () => {
      // Credentials set in when
    });

    when('the data is correct', async () => {
      response = await request(httpServer)
        .post('/auth/login')
        .send({ name: 'auth_testuser', password: 'Test1234' });
    });

    then('the user should be logged in successfully', () => {
      expect(response.body).toHaveProperty('access_token');
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  // --- Invalid credentials ---
  test('Invalid credentials', ({ when, then, and }) => {
    when('the user inputs incorrect data', async () => {
      response = await request(httpServer)
        .post('/auth/login')
        .send({ name: 'auth_testuser', password: 'WrongPassword1' });
    });

    then('the system should reject it', () => {
      expect(response.body).not.toHaveProperty('accessToken');
    });

    and('the system returns 401', () => {
      expect(response.status).toBe(401);
    });
  });

  // --- Formatting errors ---
  test('Formatting errors', ({ when, then, and }) => {
    when('there are errors in writing username or password', async () => {
      response = await request(httpServer)
        .post('/auth/login')
        .send({ name: '', password: '' });
    });

    then('the system should clarify the errors', () => {
      // Expect a 400 with validation errors
      expect(response.status).toBe(400);
    });

    shared.andSystemReturnsStatus(and, () => response);
  });

  // --- Using an invalid refresh token ---
  test('Using an invalid refresh token', ({ when, then, and }) => {
    when('the user provides an invalid refresh token', async () => {
      response = await request(httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token-xyz' });
    });

    then('the system should reject it', () => {
      expect(response.body).not.toHaveProperty('accessToken');
    });

    and('the system returns 401', () => {
      expect(response.status).toBe(401);
    });
  });
});
