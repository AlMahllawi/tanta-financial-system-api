import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionPriority, UserRole } from '../../prisma/generated/enums.js';
import { TransactionQuery } from './enums/transaction-query.enum.js';
import { TransactionSummary } from './entities/transaction-summary.entity.js';

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
      await controller.create(1, createTransactionDto);
      expect(transactionService.create).toHaveBeenCalledWith(
        1,
        createTransactionDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of transaction summaries', async () => {
      transactionService.findAll.mockResolvedValue({
        data: [new TransactionSummary()],
        summary: {} as any,
        pagination: {
          total: 1,
          lastPage: 1,
          currentPage: 1,
          perPage: 10,
          prev: null,
          next: null,
        },
      });
      await controller.findAll(1, {});
      expect(transactionService.findAll).toHaveBeenCalledWith(1, {});
    });

    it('should allow admin to access all transaction summaries', async () => {
      transactionService.findAll.mockResolvedValue({
        data: [new TransactionSummary()],
        summary: {} as any,
        pagination: {
          total: 1,
          lastPage: 1,
          currentPage: 1,
          perPage: 10,
          prev: null,
          next: null,
        },
      });
      await controller.findAll(1, { query: TransactionQuery.ALL });
      expect(transactionService.findAll).toHaveBeenCalledWith(1, {
        query: TransactionQuery.ALL,
      });
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a transaction if found', async () => {
      transactionService.findOne.mockResolvedValue(new Transaction());
      transactionService.isParticipant.mockResolvedValue(true);
      await controller.findOne(1, UserRole.USER, id);
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
      transactionService.isCreator.mockResolvedValue(true);
      await controller.update(1, UserRole.USER, id, updateTransactionDto);
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
      transactionService.isCreator.mockResolvedValue(true);
      await controller.remove(1, UserRole.USER, id);
      expect(transactionService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('attachDocument', () => {
    it('should attach a document successfully', async () => {
      const transactionId = 1;
      const documentId = 2;
      const userId = 3;
      transactionService.attachDocument.mockResolvedValue(new Transaction());
      transactionService.findLatestForward.mockResolvedValue(undefined);
      await controller.attachDocument(
        userId,
        UserRole.USER,
        transactionId,
        documentId,
      );
      expect(transactionService.attachDocument).toHaveBeenCalledWith(
        transactionId,
        documentId,
        userId,
      );
    });
  });

  describe('detachDocument', () => {
    it('should detach a document successfully', async () => {
      const transactionId = 1;
      const documentId = 2;
      const userId = 3;
      transactionService.detachDocument.mockResolvedValue(new Transaction());
      transactionService.findLatestForward.mockResolvedValue(undefined);
      transactionService.isAttacher.mockResolvedValue(true);
      await controller.detachDocument(
        userId,
        UserRole.USER,
        transactionId,
        documentId,
      );
      expect(transactionService.detachDocument).toHaveBeenCalledWith(
        transactionId,
        documentId,
      );
    });
  });
});
