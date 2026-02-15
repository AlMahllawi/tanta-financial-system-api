import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionPriority } from '../../prisma/generated/enums.js';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: DeepMockProxy<TransactionService>;

  beforeEach(async () => {
    transactionService = mockDeep<TransactionService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: transactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createTransactionDto: CreateTransactionDto = {
      title: 'Test Transaction',
      description: 'Test Description',
      typeName: 'Financial',
      priority: TransactionPriority.MEDIUM,
    };

    it('should successfully create a transaction', async () => {
      transactionService.create.mockResolvedValue(new Transaction());
      await controller.create(createTransactionDto, 1);
      expect(transactionService.create).toHaveBeenCalledWith(
        1,
        createTransactionDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of transactions', async () => {
      transactionService.findAll.mockResolvedValue([new Transaction()]);
      await controller.findAll();
      expect(transactionService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a transaction if found', async () => {
      transactionService.findOne.mockResolvedValue(new Transaction());
      await controller.findOne(id);
      expect(transactionService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    const id = 1;
    const updateTransactionDto: UpdateTransactionDto = {
      title: 'Updated Title',
    };

    it('should successfully update a transaction', async () => {
      transactionService.update.mockResolvedValue(new Transaction());
      await controller.update(id, updateTransactionDto);
      expect(transactionService.update).toHaveBeenCalledWith(
        id,
        updateTransactionDto,
      );
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a transaction', async () => {
      transactionService.remove.mockResolvedValue(new Transaction());
      await controller.remove(id);
      expect(transactionService.remove).toHaveBeenCalledWith(id);
    });
  });
});
