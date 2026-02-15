import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { NotFoundException } from '@nestjs/common';
import { TransactionPriority } from '../../prisma/generated/enums.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const transactionWithDocs = {
    id: 1,
    title: 'Test Transaction',
    description: 'Test Description',
    typeName: 'Financial',
    fulfilled: false,
    priority: TransactionPriority.MEDIUM,
    creatorId: 1,
    createdAt: new Date(),
    documents: [],
  };

  describe('create', () => {
    const creatorId = 1;
    const createTransactionDto: CreateTransactionDto = {
      title: 'Test Transaction',
      description: 'Test Description',
      typeName: 'Financial',
      priority: TransactionPriority.MEDIUM,
    };

    it('should successfully create a transaction', async () => {
      const createdTransaction = {
        id: 1,
        ...createTransactionDto,
        fulfilled: false,
        creatorId,
        createdAt: new Date(),
        documents: [],
      };

      prismaMock.transaction.create.mockResolvedValue(
        createdTransaction as any,
      );

      const result = await service.create(creatorId, createTransactionDto);

      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createTransactionDto,
          creatorId,
          documents: { create: [] },
        }),
        include: { documents: { include: { document: true } } },
      });
      expect(result).toBeInstanceOf(Transaction);
    });

    it('should throw NotFoundException if transaction type not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'typeName' },
        },
      );

      prismaMock.transaction.create.mockRejectedValue(error);

      await expect(
        service.create(creatorId, createTransactionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if creator not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'creatorId' },
        },
      );

      prismaMock.transaction.create.mockRejectedValue(error);

      await expect(
        service.create(creatorId, createTransactionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transaction.create.mockRejectedValue(error);

      await expect(
        service.create(creatorId, createTransactionDto),
      ).rejects.toThrow(error);
    });

    it('should throw NotFoundException if any document is invalid', async () => {
      const documentsIds = [1, 2, 99]; // 99 is invalid
      const dtoWithDocs = { ...createTransactionDto, documentsIds };

      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed\nKey (documentId)=(99) is not present in table "Document".',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'transactionDocument_documentId_fkey' },
        },
      );

      prismaMock.transaction.create.mockRejectedValue(error);

      await expect(service.create(creatorId, dtoWithDocs)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of transactions', async () => {
      const transactions = [transactionWithDocs];

      prismaMock.transaction.findMany.mockResolvedValue(transactions as any);

      const result = await service.findAll();

      expect(prismaMock.transaction.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Transaction);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transaction.findMany.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a transaction if found', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(
        transactionWithDocs as any,
      );

      const result = await service.findOne(id);

      expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { documents: { include: { document: true } } },
      });
      expect(result).toBeInstanceOf(Transaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transaction.findUnique.mockRejectedValue(error);

      await expect(service.findOne(id)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const id = 1;
    const updateTransactionDto: UpdateTransactionDto = {
      title: 'Updated Title',
      fulfilled: true,
    };

    it('should successfully update a transaction', async () => {
      const updatedTransaction = {
        id,
        title: updateTransactionDto.title as string,
        description: 'Test Description',
        typeName: 'Financial',
        fulfilled: true,
        priority: TransactionPriority.MEDIUM,
        creatorId: 1,
        createdAt: new Date(),
        documents: [],
      };

      prismaMock.transaction.update.mockResolvedValue(
        updatedTransaction as any,
      );

      const result = await service.update(id, updateTransactionDto);

      expect(prismaMock.transaction.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id },
        data: updateTransactionDto,
        include: { documents: { include: { document: true } } },
      });
      expect(result).toBeInstanceOf(Transaction);
    });

    it('should throw NotFoundException if transaction to update does not exist', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.transaction.update.mockRejectedValue(error);

      await expect(service.update(id, updateTransactionDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if transaction type not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'typeName' },
        },
      );

      prismaMock.transaction.update.mockRejectedValue(error);

      await expect(service.update(id, updateTransactionDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transaction.update.mockRejectedValue(error);

      await expect(service.update(id, updateTransactionDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a transaction', async () => {
      const deletedTransaction = {
        id,
        title: 'Test Transaction',
        description: 'Test Description',
        typeName: 'Financial',
        fulfilled: false,
        priority: TransactionPriority.MEDIUM,
        creatorId: 1,
        createdAt: new Date(),
        documents: [],
      };

      prismaMock.transaction.delete.mockResolvedValue(
        deletedTransaction as any,
      );

      const result = await service.remove(id);

      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({
        where: { id },
        include: { documents: { include: { document: true } } },
      });
      expect(result).toBeInstanceOf(Transaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.transaction.delete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transaction.delete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(error);
    });
  });
});
