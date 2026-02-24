import { defineFeature, loadFeature } from 'jest-cucumber';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

import * as http from 'http';

interface AppMetadata {
  name: string;
  version: string;
  description: string;
  docs: string;
  timestamp: string;
  health: {
    status: string;
    uptime: number;
    memoryUsage: number;
  };
}

const feature = loadFeature('./test/features/app.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let response: request.Response;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('Fetch API Metadata and Health', ({ given, when, then, and }) => {
    given('the API is running', () => {
      expect(app).toBeDefined();
    });

    when('I request the root endpoint', async () => {
      response = await request(app.getHttpServer() as http.Server).get('/');
    });

    then(
      'the system returns the metadata containing name, version, and description',
      () => {
        const body = response.body as AppMetadata;
        expect(typeof body.name).toBe('string');
        expect(typeof body.version).toBe('string');
        expect(typeof body.description).toBe('string');
        expect(typeof body.docs).toBe('string');
        expect(typeof body.timestamp).toBe('string');
      },
    );

    and('the system returns the health status as up', () => {
      const body = response.body as AppMetadata;
      expect(body.health.status).toBe('up');
      expect(typeof body.health.uptime).toBe('number');
      expect(typeof body.health.memoryUsage).toBe('number');
    });

    and('the system returns response 200', () => {
      expect(response.status).toBe(200);
    });
  });
});
