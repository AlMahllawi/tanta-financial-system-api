import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) - Should return API Metadata and Health', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          name: expect.any(String),
          version: expect.any(String),
          description: expect.any(String),
          docs: expect.any(String),
          timestamp: expect.any(String),
          health: {
            status: 'up',
            uptime: expect.any(Number),
            memoryUsage: expect.any(Number),
          },
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
