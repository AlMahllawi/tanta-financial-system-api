/* eslint-disable @typescript-eslint/unbound-method */
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetCategoriesService } from './budget-categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CreateBudgetEntryDto } from './dto/create-budget-entry.dto.js';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto.js';
import {
  BudgetCategory,
  BudgetEntry,
} from './entities/budget-category.entity.js';
import { BudgetCategoryQueryDto } from './dto/budget-category-query.dto.js';
import { BudgetEntryQueryDto } from './dto/budget-entry-query.dto.js';
import { Prisma } from '../../prisma/generated/client.js';

describe('BudgetCategoriesService', () => {
  let service: BudgetCategoriesService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg) as Promise<never>;

      if (typeof arg === 'function') {
        const fn = arg as (p: PrismaService) => Promise<unknown>;
        return fn(prismaMock) as Promise<never>;
      }
      return undefined as never;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetCategoriesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BudgetCategoriesService>(BudgetCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const categoryMock: Prisma.BudgetCategoryGetPayload<Record<string, never>> = {
    name: 'Engineering',
  };

  const categoryDetailsMock: Prisma.BudgetCategoryGetPayload<{
    include: { details: true };
  }> = {
    ...categoryMock,
    details: {
      budgetName: 'Engineering',
      budget: 1000,
      allocated: 500,
      available: 500,
    },
  };

  describe('create', () => {
    it('should create a budget category and return defaulted detail numbers', async () => {
      prismaMock.budgetCategory.create.mockResolvedValue(categoryMock);

      const result = await service.create('Engineering');

      expect(() => prismaMock.budgetCategory.create).not.toThrow();
      expect(prismaMock.budgetCategory.create).toHaveBeenCalledWith({
        data: { name: 'Engineering' },
      });
      expect(result).toBeInstanceOf(BudgetCategory);
      expect(result.name).toBe('Engineering');
      expect(result.budget).toBe(0);
      expect(result.allocated).toBe(0);
      expect(result.available).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of formatted budget categories', async () => {
      const queryDto: BudgetCategoryQueryDto = { page: 1, perPage: 10 };

      prismaMock.budgetCategory.findMany.mockResolvedValue([
        categoryDetailsMock,
      ]);
      prismaMock.budgetCategory.count.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(BudgetCategory);
      expect(result.data[0].name).toBe('Engineering');
      expect(result.data[0].budget).toBe(1000);
      expect(result.pagination).toEqual({
        total: 1,
        lastPage: 1,
        currentPage: 1,
        perPage: 10,
        prev: null,
        next: null,
      });
    });
  });

  describe('findOne', () => {
    it('should return a formulated category by name', async () => {
      prismaMock.budgetCategory.findUniqueOrThrow.mockResolvedValue(
        categoryDetailsMock,
      );

      const result = await service.findOne('Engineering');

      expect(() => prismaMock.budgetCategory.findUniqueOrThrow).not.toThrow();
      expect(prismaMock.budgetCategory.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { name: 'Engineering' },
        include: { details: true },
      });
      expect(result).toBeInstanceOf(BudgetCategory);
      expect(result.name).toBe('Engineering');
      expect(result.budget).toBe(1000);
    });
  });

  describe('update', () => {
    it('should effectively rename a budget category', async () => {
      const updateDto: UpdateBudgetCategoryDto = { newName: 'Product' };
      prismaMock.budgetCategory.update.mockResolvedValue({
        ...categoryDetailsMock,
        name: 'Product',
      });

      const result = await service.update('Engineering', updateDto);

      expect(() => prismaMock.budgetCategory.update).not.toThrow();
      expect(prismaMock.budgetCategory.update).toHaveBeenCalledWith({
        where: { name: 'Engineering' },
        data: { name: 'Product' },
        include: { details: true },
      });
      expect(result).toBeInstanceOf(BudgetCategory);
      expect(result.name).toBe('Product');
    });
  });

  describe('remove', () => {
    it('should delete a category and return it', async () => {
      prismaMock.budgetCategory.delete.mockResolvedValue(categoryDetailsMock);

      const result = await service.remove('Engineering');

      expect(() => prismaMock.budgetCategory.delete).not.toThrow();
      expect(prismaMock.budgetCategory.delete).toHaveBeenCalledWith({
        where: { name: 'Engineering' },
        include: { details: true },
      });
      expect(result.name).toBe('Engineering');
    });
  });

  describe('addEntry', () => {
    it('should create an entry and return the model', async () => {
      const entryMock: Prisma.BudgetEntryGetPayload<Record<string, never>> = {
        id: 1,
        budgetName: 'Engineering',
        amount: 250,
        inputterId: 1,
        createdAt: new Date(),
      };
      const dto: CreateBudgetEntryDto = { amount: 250 };
      prismaMock.budgetEntry.create.mockResolvedValue(entryMock);

      const result = await service.addEntry('Engineering', dto, 1);

      expect(() => prismaMock.budgetEntry.create).not.toThrow();
      expect(prismaMock.budgetEntry.create).toHaveBeenCalledWith({
        data: {
          budgetName: 'Engineering',
          amount: dto.amount,
          inputterId: 1,
        },
      });
      expect(result).toBeInstanceOf(BudgetEntry);
      expect(result.amount).toBe(250);
    });
  });

  describe('removeEntry', () => {
    it('should delete an entry and return the model', async () => {
      const entryMock: Prisma.BudgetEntryGetPayload<Record<string, never>> = {
        id: 1,
        budgetName: 'Engineering',
        amount: 250,
        inputterId: 1,
        createdAt: new Date(),
      };
      prismaMock.budgetEntry.findFirst.mockResolvedValue(entryMock);
      prismaMock.budgetEntry.delete.mockResolvedValue(entryMock);

      const result = await service.removeEntry('Engineering', 1);

      expect(prismaMock.budgetEntry.findFirst).toHaveBeenCalled();
      expect(prismaMock.budgetEntry.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeInstanceOf(BudgetEntry);
      expect(result.id).toBe(1);
    });

    it('should throw ErrorCode.NOT_LATEST_BUDGET_ENTRY if not the latest', async () => {
      const latestEntryMock: Prisma.BudgetEntryGetPayload<
        Record<string, never>
      > = {
        id: 2,
        budgetName: 'Engineering',
        amount: 500,
        inputterId: 1,
        createdAt: new Date(),
      };

      prismaMock.budgetEntry.findFirst.mockResolvedValue(latestEntryMock);

      await expect(service.removeEntry('Engineering', 1)).rejects.toThrow();
    });
  });

  describe('findAllEntries', () => {
    it('should return paginated budget entries via transaction', async () => {
      const queryDto: BudgetEntryQueryDto = { page: 1, perPage: 10 };
      const entryMock: Prisma.BudgetEntryGetPayload<Record<string, never>> = {
        id: 1,
        budgetName: 'Engineering',
        amount: 250,
        inputterId: 1,
        createdAt: new Date(),
      };

      prismaMock.budgetCategory.findUniqueOrThrow.mockResolvedValue(
        categoryMock,
      );
      prismaMock.budgetEntry.findMany.mockResolvedValue([entryMock]);
      prismaMock.budgetEntry.count.mockResolvedValue(1);

      const result = await service.findAllEntries('Engineering', queryDto);

      expect(() => prismaMock.$transaction).not.toThrow();
      expect(prismaMock.$transaction).toHaveBeenCalled();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(BudgetEntry);
      expect(result.pagination).toEqual({
        total: 1,
        lastPage: 1,
        currentPage: 1,
        perPage: 10,
        prev: null,
        next: null,
      });
    });
  });
});
