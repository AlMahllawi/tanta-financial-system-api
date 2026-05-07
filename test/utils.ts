import { Server, STATUS_CODES } from 'node:http';

import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { Response } from 'supertest';

import { UserRole } from '../prisma/generated/enums.js';
import { departmentFactory } from '../prisma/seeds/department.factory.js';
import { userFactory } from '../prisma/seeds/user.factory.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { apiExceptionResponseSchema, authResponseSchema } from './schemas.js';

type Args = Record<string, string | number | boolean | null | undefined>;

export interface ApiExceptionResponse {
  statusCode: number;
  message: { key: string; args?: Args };
  error: string;
}

export function expectApiException(
  response: Response,
  expectedStatus: HttpStatus,
  expectedErrorKey: string,
  expectedArgs?: Args,
) {
  expect(response.status).toBe(expectedStatus);

  const body = apiExceptionResponseSchema.parse(response.body);
  expect(body.statusCode).toBe(expectedStatus);
  expect(body.message.key).toBe(expectedErrorKey);

  expect(body.error).toBe(STATUS_CODES[expectedStatus]);

  if (expectedArgs) expect(body.message.args).toMatchObject(expectedArgs);
}

export async function clearDatabase(prisma: PrismaService) {
  await prisma.transactionForward.deleteMany();
  await prisma.transactionDocument.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budgetEntry.deleteMany();
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transactionType.deleteMany();
  await prisma.department.updateMany({ data: { managerId: null } });
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.budgetCategory.deleteMany();
}

export const TEST_PASSWORD = 'Test1234!';

/**
 * Creates a test user and authenticates them via the HTTP target.
 *
 * The user and department are always created via Prisma (available in both
 * internal and external mode). Authentication is performed via HTTP against
 * whichever target is active.
 *
 * @param prisma      - PrismaService instance for database seeding.
 * @param httpTarget  - The supertest target (http.Server or URL string).
 * @param name        - Optional user name override.
 * @param role        - User role (default: USER).
 * @param departmentName - Optional department name.
 */
export async function createTestUser(
  prisma: PrismaService,
  httpTarget: string | Server,
  name?: string,
  role: UserRole = UserRole.USER,
  departmentName?: string,
) {
  const departmentData = departmentFactory({ name: departmentName });

  const userData = await userFactory(departmentData.name, {
    name,
    role,
    password: TEST_PASSWORD,
  });

  await prisma.department.upsert({
    where: { name: departmentData.name },
    update: {},
    create: departmentData,
  });

  const user = await prisma.user.upsert({
    where: { name: userData.name },
    update: userData,
    create: userData,
  });

  const authenticationResponse = await request(httpTarget)
    .post('/api/v0/auth/login')
    .send({ name: user.name, password: TEST_PASSWORD });

  if (
    authenticationResponse.status !== (HttpStatus.OK as number) &&
    authenticationResponse.status !== (HttpStatus.CREATED as number)
  ) {
    const targetDesc =
      typeof httpTarget === 'string' ? httpTarget : 'internal server';
    throw new Error(
      `Failed to authenticate test user "${user.name}" against ${targetDesc}. ` +
        `Status: ${authenticationResponse.status}. Body: ${JSON.stringify(authenticationResponse.body)}`,
    );
  }

  const authentication = authResponseSchema.parse(authenticationResponse.body);

  return { id: user.id, user, token: authentication.access_token };
}
