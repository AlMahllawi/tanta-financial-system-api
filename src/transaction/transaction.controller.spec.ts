import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionPriority, UserRole } from '../../prisma/generated/enums.js';
import { TransactionQuery } from './enums/transaction-query.enum.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

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
    it('should return an array of transactions', async () => {
      transactionService.findAll.mockResolvedValue([new Transaction()]);
      await controller.findAll(1, UserRole.USER);
      expect(transactionService.findAll).toHaveBeenCalledWith(1, undefined);
    });

    it('should throw ForbiddenException if non-admin tries to access all transactions', async () => {
      try {
        await controller.findAll(1, UserRole.USER, TransactionQuery.ALL);
        fail('Should have thrown ForbiddenException');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ForbiddenException);
        expect(e.getResponse()).toEqual({
          key: ErrorCode.MISSING_ROLE,
          args: { role: UserRole.ADMIN },
        });
      }
    });

    it('should allow admin to access all transactions', async () => {
      transactionService.findAll.mockResolvedValue([new Transaction()]);
      await controller.findAll(1, UserRole.ADMIN, TransactionQuery.ALL);
      expect(transactionService.findAll).toHaveBeenCalledWith(
        1,
        TransactionQuery.ALL,
      );
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

  describe('attachDocument', () => {
    const transactionId = 1;
    const documentId = 2;
    const userId = 3;

    it('should attach a document successfully', async () => {
      transactionService.attachDocument.mockResolvedValue(new Transaction());
      await controller.attachDocument(transactionId, documentId, userId);
      expect(transactionService.attachDocument).toHaveBeenCalledWith(
        transactionId,
        documentId,
        userId,
      );
    });
  });

  describe('detachDocument', () => {
    const transactionId = 1;
    const documentId = 2;

    it('should detach a document successfully', async () => {
      transactionService.detachDocument.mockResolvedValue(new Transaction());
      await controller.detachDocument(transactionId, documentId);
      expect(transactionService.detachDocument).toHaveBeenCalledWith(
        transactionId,
        documentId,
      );
    });
  });
});
