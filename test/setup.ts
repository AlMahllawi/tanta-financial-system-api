/**
 * Shared E2E test setup module.
 *
 * Supports two modes controlled by the `E2E_API_URL` environment variable:
 *
 * - **Internal mode** (default): Boots a NestJS application and uses it as
 *   the HTTP target. Prisma is obtained from the NestJS module.
 *
 * - **External mode** (`E2E_API_URL` is set): Points supertest at the given
 *   URL. A standalone PrismaService is created to access the **same database**
 *   for seeding and cleanup. Tests that require NestJS-internal services
 *   (EventEmitter, NotificationService, etc.) are skipped.
 */

import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';

import { AppModule } from '../src/app.module.js';
import { RoleSerializerInterceptor } from '../src/common/interceptors/role-serializer.interceptor.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// ─── State ────────────────────────────────────────────────────────────────────

let app: INestApplication | null = null;
let prisma: PrismaService | null = null;
let moduleFixture: TestingModule | null = null;

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Whether the tests are running against an external API.
 */
export const isExternalMode = (): boolean => !!process.env.E2E_API_URL;

/**
 * Returns the target that supertest should use.
 *
 * - In **internal mode** this is the NestJS `http.Server`.
 * - In **external mode** this is the base URL string (e.g. `http://localhost:4000`).
 */
export function getHttpTarget(): string | http.Server {
  if (isExternalMode()) return process.env.E2E_API_URL!;

  if (!app)
    throw new Error(
      'Internal app has not been bootstrapped. Call bootstrapApp() in beforeAll.',
    );

  return app.getHttpServer() as http.Server;
}

/**
 * Returns the Prisma service instance.
 *
 * Available in **both** modes — in external mode a standalone PrismaService
 * is created that connects to the same database (via DATABASE_URL).
 */
export function getPrisma(): PrismaService {
  if (!prisma)
    throw new Error(
      'PrismaService has not been initialized. Call bootstrapApp() in beforeAll.',
    );

  return prisma;
}

/**
 * Returns the NestJS `TestingModule` so callers can resolve arbitrary providers.
 *
 * @throws in external mode — the NestJS module is not available.
 */
export function getModule(): TestingModule {
  if (isExternalMode())
    throw new Error(
      'TestingModule is not available in external mode (E2E_API_URL is set).',
    );

  if (!moduleFixture)
    throw new Error(
      'Internal app has not been bootstrapped. Call bootstrapApp() in beforeAll.',
    );

  return moduleFixture;
}

/**
 * Returns the NestJS application instance.
 *
 * @throws in external mode — the NestJS app is not available.
 */
export function getApp(): INestApplication {
  if (isExternalMode())
    throw new Error(
      'INestApplication is not available in external mode (E2E_API_URL is set).',
    );

  if (!app)
    throw new Error(
      'Internal app has not been bootstrapped. Call bootstrapApp() in beforeAll.',
    );

  return app;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Bootstraps the test environment.
 *
 * - **Internal mode**: Creates a NestJS application and obtains Prisma from it.
 * - **External mode**: Creates a standalone PrismaService for DB access.
 *
 * @param options.withValidationPipe - Whether to register the global
 *   `ValidationPipe`. Defaults to `true`. Ignored in external mode.
 */
export async function bootstrapApp(
  options: { withValidationPipe?: boolean } = {},
): Promise<void> {
  const { withValidationPipe = true } = options;

  if (isExternalMode()) {
    // Create a standalone Prisma instance for database seeding/cleanup.
    prisma = new PrismaService();
    await prisma.$connect();
    return;
  }

  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '0', // Matches package.json major version
  });

  if (withValidationPipe)
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useGlobalInterceptors(
    new RoleSerializerInterceptor(moduleFixture.get(Reflector)),
  );

  prisma = moduleFixture.get<PrismaService>(PrismaService);
  await app.init();
}

/**
 * Tears down the test environment.
 *
 * - **Internal mode**: Closes the NestJS application (which also disconnects Prisma).
 * - **External mode**: Disconnects the standalone Prisma instance.
 */
export async function teardownApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
    prisma = null;
    moduleFixture = null;
  } else if (prisma) {
    // External mode — disconnect standalone Prisma.
    await prisma.$disconnect();
    prisma = null;
  }
}

// ─── Conditional skip helper ──────────────────────────────────────────────────

/**
 * A helper that returns `describe.skip` when running in external mode and the
 * regular `describe` otherwise. Use this to wrap test groups that require
 * NestJS-internal services (EventEmitter, NotificationService, etc.).
 *
 * Note: Prisma-dependent tests do NOT need this — Prisma is available in both
 * modes.
 *
 * @example
 * ```ts
 * describeInternal('EventEmitter-dependent tests', () => { ... });
 * ```
 */
export const describeInternal: typeof describe = isExternalMode()
  ? (((name: string, fn: Parameters<typeof describe>[1]) => {
      process.stdout.write(
        `\x1b[33m[E2E WARNING] Skipping internal-only describe block: "${name}"\x1b[0m\n`,
      );
      return describe.skip(name, fn);
    }) as typeof describe)
  : describe;

/**
 * Same as `describeInternal` but for individual `it` blocks.
 */
export const itInternal: typeof it = isExternalMode()
  ? (((name: string, fn: Parameters<typeof it>[1]) => {
      process.stdout.write(
        `\x1b[33m[E2E WARNING] Skipping internal-only test: "${name}"\x1b[0m\n`,
      );
      return it.skip(name, fn);
    }) as typeof it)
  : it;
