import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';

import { UserRole } from '../prisma/generated/enums.js';
import { budgetCategoryFactory } from '../prisma/seeds/budget-category.factory.js';
import { transactionFactory } from '../prisma/seeds/transaction.factory.js';
import { transactionTypeFactory } from '../prisma/seeds/transaction-type.factory.js';
import { ErrorCode } from '../src/common/enums/error-codes.enum.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  budgetCategoryQueryDtoSchema,
  budgetCategorySchema,
  budgetEntryQueryDtoSchema,
  budgetEntrySchema,
  createBudgetEntryDtoSchema,
  dataWrapperSchema,
  updateBudgetCategoryDtoSchema,
} from './schemas.js';
import {
  bootstrapApp,
  getHttpTarget,
  getPrisma,
  teardownApp,
} from './setup.js';
import { clearDatabase, createTestUser, expectApiException } from './utils.js';

describe('BudgetCategoriesController (e2e)', () => {
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;
  let targetCategoryName: string;
  let adminName: string;
  let adminUserId: number;

  beforeAll(async () => {
    await bootstrapApp();
    prisma = getPrisma();

    await clearDatabase(prisma);
    const admin = await createTestUser(
      prisma,
      getHttpTarget(),
      undefined,
      UserRole.ADMIN,
    );
    adminToken = admin.token;
    adminName = admin.user.name;
    adminUserId = admin.id;

    userToken = (
      await createTestUser(
        prisma,
        getHttpTarget(),
        undefined,
        UserRole.USER,
        admin.user.departmentName,
      )
    ).token;

    targetCategoryName = budgetCategoryFactory().name;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await teardownApp();
  });

  describe('POST /budget-categories/:name', () => {
    it('should return 201 Budget category created successfully', async () => {
      const categoryData = budgetCategoryFactory();
      const response = await request(getHttpTarget())
        .post(
          `/api/v0/budget-categories/${encodeURIComponent(categoryData.name)}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.CREATED);
      budgetCategorySchema
        .extend({ name: z.literal(categoryData.name) })
        .parse(response.body);
    });

    it('should return 403 MISSING_ROLE', async () => {
      const response = await request(getHttpTarget())
        .post(
          `/api/v0/budget-categories/${encodeURIComponent(budgetCategoryFactory().name)}`,
        )
        .set('Authorization', `Bearer ${userToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        {
          roles: UserRole.ADMIN,
        },
      );
    });

    it('should return 409 BUDGET_CATEGORY_ALREADY_EXISTS', async () => {
      const categoryData = budgetCategoryFactory();
      await prisma.budgetCategory.upsert({
        where: { name: categoryData.name },
        update: {},
        create: { name: categoryData.name },
      });

      const response = await request(getHttpTarget())
        .post(
          `/api/v0/budget-categories/${encodeURIComponent(categoryData.name)}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.BUDGET_CATEGORY_ALREADY_EXISTS,
        { categoryName: categoryData.name },
      );
    });
  });

  describe('GET /budget-categories', () => {
    it('should return 200 list of budget categories', async () => {
      const response = await request(getHttpTarget())
        .get('/api/v0/budget-categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(budgetCategorySchema).parse(data);
    });

    it('should return 200 filtered list by name', async () => {
      const filterCategoryData = budgetCategoryFactory();
      await prisma.budgetCategory.upsert({
        where: { name: filterCategoryData.name },
        update: {},
        create: { name: filterCategoryData.name },
      });
      const filterSubstring = filterCategoryData.name.split(' ')[0];

      const response = await request(getHttpTarget())
        .get('/api/v0/budget-categories')
        .query(budgetCategoryQueryDtoSchema.parse({ name: filterSubstring }))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(budgetCategorySchema).parse(data);
      expect(parsedData.some((d) => d.name === filterCategoryData.name)).toBe(
        true,
      );
    });

    it('should return 404 BUDGET_CATEGORY_NOT_FOUND', async () => {
      const unknownName = budgetCategoryFactory().name;
      await prisma.budgetCategory.deleteMany({ where: { name: unknownName } });

      const response = await request(getHttpTarget())
        .get(`/api/v0/budget-categories/${encodeURIComponent(unknownName)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.NOT_FOUND,
        ErrorCode.BUDGET_CATEGORY_NOT_FOUND,
        { categoryName: unknownName },
      );
    });

    it('should hide preallocation from regular users', async () => {
      const category = budgetCategoryFactory();
      await prisma.budgetCategory.create({
        data: { name: category.name, preallocation: 1000 },
      });

      const response = await request(getHttpTarget())
        .get(`/api/v0/budget-categories/${encodeURIComponent(category.name)}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      budgetCategorySchema
        .omit({ preallocation: true })
        .strict()
        .parse(response.body);
    });

    it('should show preallocation to admins', async () => {
      const category = budgetCategoryFactory();
      await prisma.budgetCategory.create({
        data: { name: category.name, preallocation: 1234 },
      });

      const response = await request(getHttpTarget())
        .get(`/api/v0/budget-categories/${encodeURIComponent(category.name)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      budgetCategorySchema
        .extend({ preallocation: z.literal(1234) })
        .parse(response.body);
    });
  });

  describe('PATCH /budget-categories/:name', () => {
    it('should return 200 Budget category updated successfully (name and preallocation)', async () => {
      const originalCategory = budgetCategoryFactory();
      const updatedCategory = budgetCategoryFactory();
      const preallocation = 5000;
      await prisma.budgetCategory.upsert({
        where: { name: originalCategory.name },
        update: {},
        create: { name: originalCategory.name },
      });

      const response = await request(getHttpTarget())
        .patch(
          `/api/v0/budget-categories/${encodeURIComponent(originalCategory.name)}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          updateBudgetCategoryDtoSchema.parse({
            newName: updatedCategory.name,
            preallocation,
          }),
        );

      expect(response.status).toBe(HttpStatus.OK);
      budgetCategorySchema
        .extend({
          name: z.literal(updatedCategory.name),
          preallocation: z.literal(preallocation),
        })
        .parse(response.body);
    });

    it('should return 403 MISSING_ROLE for non-admin update', async () => {
      const category = budgetCategoryFactory();
      await prisma.budgetCategory.create({ data: { name: category.name } });

      const response = await request(getHttpTarget())
        .patch(`/api/v0/budget-categories/${encodeURIComponent(category.name)}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ preallocation: 1000 });

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.MISSING_ROLE,
        { roles: UserRole.ADMIN },
      );
    });
  });

  describe('POST /budget-categories/:name/entry', () => {
    it('should return 201 Budget entry added successfully', async () => {
      await prisma.budgetCategory.upsert({
        where: { name: targetCategoryName },
        update: {},
        create: { name: targetCategoryName },
      });

      const response = await request(getHttpTarget())
        .post(
          `/api/v0/budget-categories/${encodeURIComponent(targetCategoryName)}/entry`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBudgetEntryDtoSchema.parse({ amount: 1000 }));

      expect(response.status).toBe(HttpStatus.CREATED);
      const body = budgetEntrySchema.parse(response.body);
      expect(body.amount).toBe(1000);
      expect(body.budgetName).toBe(targetCategoryName);
    });
  });

  describe('GET /budget-categories/:name/entry', () => {
    it('should return 200 list of budget entries', async () => {
      const response = await request(getHttpTarget())
        .get(
          `/api/v0/budget-categories/${encodeURIComponent(targetCategoryName)}/entry`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      z.array(budgetEntrySchema).parse(data);
    });

    it('should return 200 filtered list of budget entries by inputter', async () => {
      const response = await request(getHttpTarget())
        .get(
          `/api/v0/budget-categories/${encodeURIComponent(targetCategoryName)}/entry`,
        )
        .query(budgetEntryQueryDtoSchema.parse({ inputter: adminName }))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(budgetEntrySchema).parse(data);
      expect(parsedData.length).toBeGreaterThan(0);
    });

    it('should return 200 filtered list of budget entries by amount range', async () => {
      const response = await request(getHttpTarget())
        .get(
          `/api/v0/budget-categories/${encodeURIComponent(targetCategoryName)}/entry`,
        )
        .query(
          budgetEntryQueryDtoSchema.parse({ minAmount: 500, maxAmount: 1500 }),
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      const { data } = dataWrapperSchema.parse(response.body);
      const parsedData = z.array(budgetEntrySchema).parse(data);
      expect(parsedData.some((e) => e.amount === 1000)).toBe(true);
    });
  });

  describe('DELETE /budget-categories/:name/entry/:id', () => {
    it('should return 403 NOT_LATEST_BUDGET_ENTRY when entry does not exist', async () => {
      const response = await request(getHttpTarget())
        .delete(
          `/api/v0/budget-categories/${encodeURIComponent(targetCategoryName)}/entry/999999`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_LATEST_BUDGET_ENTRY,
        { entryId: '999999' },
      );
    });

    it('should return 403 NOT_LATEST_BUDGET_ENTRY', async () => {
      const category = budgetCategoryFactory();
      await prisma.budgetCategory.create({ data: { name: category.name } });

      const entry1 = await prisma.budgetEntry.create({
        data: {
          amount: 100,
          budgetName: category.name,
          inputterId: adminUserId,
        },
      });
      await prisma.budgetEntry.create({
        data: {
          amount: 200,
          budgetName: category.name,
          inputterId: adminUserId,
        },
      });

      const response = await request(getHttpTarget())
        .delete(
          `/api/v0/budget-categories/${encodeURIComponent(category.name)}/entry/${entry1.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_LATEST_BUDGET_ENTRY,
        { entryId: String(entry1.id) },
      );
    });

    it('should return 200 Budget entry removed successfully', async () => {
      const entry = await prisma.budgetEntry.findFirst({
        where: { budgetName: targetCategoryName },
        orderBy: { createdAt: 'desc' },
      });

      const response = await request(getHttpTarget())
        .delete(
          `/api/v0/budget-categories/${encodeURIComponent(targetCategoryName)}/entry/${entry!.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('DELETE /budget-categories/:name', () => {
    it('should return 409 BUDGET_CATEGORY_IN_USE', async () => {
      const inUseCategory = budgetCategoryFactory();
      await prisma.budgetCategory.create({
        data: { name: inUseCategory.name },
      });

      const typeData = transactionTypeFactory(adminUserId);
      await prisma.transactionType.upsert({
        where: { name: typeData.name },
        update: {},
        create: { name: typeData.name, creatorId: adminUserId },
      });

      const txData = transactionFactory(adminUserId, typeData.name);
      await prisma.transaction.create({
        data: {
          ...txData,
          budgetName: inUseCategory.name,
        },
      });

      const response = await request(getHttpTarget())
        .delete(
          `/api/v0/budget-categories/${encodeURIComponent(inUseCategory.name)}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expectApiException(
        response,
        HttpStatus.CONFLICT,
        ErrorCode.BUDGET_CATEGORY_IN_USE,
        { categoryName: inUseCategory.name },
      );
    });

    it('should return 200 Budget category deleted successfully', async () => {
      const toDeleteCategory = budgetCategoryFactory();
      await prisma.budgetCategory.upsert({
        where: { name: toDeleteCategory.name },
        update: {},
        create: { name: toDeleteCategory.name },
      });

      const response = await request(getHttpTarget())
        .delete(
          `/api/v0/budget-categories/${encodeURIComponent(toDeleteCategory.name)}`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });
});
