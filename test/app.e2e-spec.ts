import { HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { HealthState } from '../src/common/enums/app.enum.js';
import { bootstrapApp, getHttpTarget, teardownApp } from './setup.js';

describe('AppController (e2e)', () => {
  beforeAll(async () => {
    await bootstrapApp({ withValidationPipe: false });
  });

  afterAll(async () => {
    await teardownApp();
  });

  describe('GET /', () => {
    it('should return the API metadata and health and return a 200 status', async () => {
      const response = await request(getHttpTarget()).get('/');

      expect(response.status).toBe(HttpStatus.OK);

      expect(response.body).toMatchObject({
        name: expect.any(String),
        version: expect.any(String),
        description: expect.any(String),
        docs: expect.any(String),
        timestamp: expect.any(String),
        health: {
          status: HealthState.UP,
          uptime: expect.any(Number),
          memoryUsage: expect.any(Number),
        },
      });
    });
  });
});
