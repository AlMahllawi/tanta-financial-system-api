import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTypeController } from './transaction-type.controller.js';
import { TransactionTypeService } from './transaction-type.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { TransactionType } from './entities/transaction-type.entity.js';
import { UserRole } from '../../prisma/generated/enums.js';

describe('TransactionTypeController', () => {
  let controller: TransactionTypeController;
  let transactionTypeService: DeepMockProxy<TransactionTypeService>;

  beforeEach(async () => {
    transactionTypeService = mockDeep<TransactionTypeService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionTypeController],
      providers: [
        {
          provide: TransactionTypeService,
          useValue: transactionTypeService,
        },
      ],
    }).compile();

    controller = module.get<TransactionTypeController>(
      TransactionTypeController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createTransactionTypeDto: CreateTransactionTypeDto = {
      name: 'Financial',
    };

    it('should successfully create a transaction type', async () => {
      transactionTypeService.create.mockResolvedValue(new TransactionType());
      await controller.create(1, createTransactionTypeDto);
      expect(transactionTypeService.create).toHaveBeenCalledWith(
        1,
        createTransactionTypeDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of transaction types for admin', async () => {
      transactionTypeService.findAll.mockResolvedValue({
        data: [new TransactionType()],
      } as any);
      await controller.findAll(
        { page: 1, perPage: 10, creatorId: 1 },
        UserRole.ADMIN,
      );
      expect(transactionTypeService.findAll).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        creatorId: 1,
      });
    });

    it('should return transaction types for user without creatorId filter', async () => {
      transactionTypeService.findAll.mockResolvedValue({
        data: [new TransactionType()],
      } as any);
      await controller.findAll({ page: 1, perPage: 10 }, UserRole.USER);
      expect(transactionTypeService.findAll).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
      });
    });

    it('should throw ApiException if non-admin tries to filter by creatorId', () => {
      expect(() =>
        controller.findAll(
          { page: 1, perPage: 10, creatorId: 1 },
          UserRole.USER,
        ),
      ).toThrow();
    });
  });

  describe('findOne', () => {
    const name = 'Financial';

    it('should return a transaction type if found', async () => {
      transactionTypeService.findOne.mockResolvedValue(new TransactionType());
      await controller.findOne(name);
      expect(transactionTypeService.findOne).toHaveBeenCalledWith(name);
    });
  });

  describe('remove', () => {
    const name = 'Financial';

    it('should successfully remove a transaction type', async () => {
      transactionTypeService.remove.mockResolvedValue(new TransactionType());
      await controller.remove(name);
      expect(transactionTypeService.remove).toHaveBeenCalledWith(name);
    });
  });
});
