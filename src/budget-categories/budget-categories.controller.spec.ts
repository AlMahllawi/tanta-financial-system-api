import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetCategoriesController } from './budget-categories.controller.js';
import { BudgetCategoriesService } from './budget-categories.service.js';
import { CreateBudgetEntryDto } from './dto/create-budget-entry.dto.js';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  BudgetCategory,
  BudgetEntry,
} from './entities/budget-category.entity.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

describe('BudgetCategoriesController', () => {
  let controller: BudgetCategoriesController;
  let service: DeepMockProxy<BudgetCategoriesService>;

  beforeEach(async () => {
    service = mockDeep<BudgetCategoriesService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetCategoriesController],
      providers: [
        {
          provide: BudgetCategoriesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BudgetCategoriesController>(
      BudgetCategoriesController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a budget category', async () => {
      const name = 'Engineering';
      const expectedResult = new BudgetCategory();
      service.create.mockResolvedValue(expectedResult);

      const result = await controller.create(name);

      expect(() => service.create(name)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of budget categories', async () => {
      const expectedResult = [new BudgetCategory()];
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(() => service.findAll()).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a budget category if found', async () => {
      const name = 'Engineering';
      const expectedResult = new BudgetCategory();
      service.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(name);

      expect(() => service.findOne(name)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('update', () => {
    it('should successfully update a budget category', async () => {
      const name = 'Engineering';
      const updateDto: UpdateBudgetCategoryDto = { newName: 'Product' };
      const expectedResult = new BudgetCategory();
      service.update.mockResolvedValue(expectedResult);

      const result = await controller.update(name, updateDto);

      expect(() => service.update(name, updateDto)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('remove', () => {
    it('should successfully remove a budget category', async () => {
      const name = 'Engineering';
      const expectedResult = new BudgetCategory();
      service.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(name);

      expect(() => service.remove(name)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('findAllEntries', () => {
    it('should return an array of budget entries', async () => {
      const name = 'Engineering';
      const paginationDto: PaginationDto = { page: 1, perPage: 10 };
      const expectedResult = {
        data: [new BudgetEntry()],
        pagination: {
          total: 1,
          lastPage: 1,
          currentPage: 1,
          perPage: 10,
          prev: null,
          next: null,
        },
      };
      service.findAllEntries.mockResolvedValue(expectedResult);

      const result = await controller.findAllEntries(name, paginationDto);

      expect(() => service.findAllEntries(name, paginationDto)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('addEntry', () => {
    it('should successfully add a budget entry', async () => {
      const name = 'Engineering';
      const dto: CreateBudgetEntryDto = { amount: 500 };
      const userId = 1;
      const expectedResult = new BudgetEntry();
      service.addEntry.mockResolvedValue(expectedResult);

      const result = await controller.addEntry(name, dto, userId);

      expect(() => service.addEntry(name, dto, userId)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });

  describe('removeEntry', () => {
    it('should successfully remove a budget entry', async () => {
      const name = 'Engineering';
      const entryId = 1;
      const expectedResult = new BudgetEntry();
      service.removeEntry.mockResolvedValue(expectedResult);

      const result = await controller.removeEntry(name, entryId);

      expect(() => service.removeEntry(name, entryId)).not.toThrow();
      expect(result).toBe(expectedResult);
    });
  });
});
