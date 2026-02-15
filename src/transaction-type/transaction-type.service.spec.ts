import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTypeService } from './transaction-type.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { TransactionType } from './entities/transaction-type.entity.js';

describe('TransactionTypeService', () => {
  let service: TransactionTypeService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionTypeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TransactionTypeService>(TransactionTypeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const creatorId = 1;
    const createTransactionTypeDto: CreateTransactionTypeDto = {
      name: 'Financial',
    };

    it('should successfully create a transaction type', async () => {
      const createdType = {
        name: createTransactionTypeDto.name,
        creatorId,
      };

      prismaMock.transactionType.create.mockResolvedValue(createdType);

      const result = await service.create(creatorId, createTransactionTypeDto);

      expect(prismaMock.transactionType.create).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(TransactionType);
    });

    it('should throw ConflictException if transaction type already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );

      prismaMock.transactionType.create.mockRejectedValue(error);

      await expect(
        service.create(creatorId, createTransactionTypeDto),
      ).rejects.toThrow(ConflictException);
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

      prismaMock.transactionType.create.mockRejectedValue(error);

      await expect(
        service.create(creatorId, createTransactionTypeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transactionType.create.mockRejectedValue(error);

      await expect(
        service.create(creatorId, createTransactionTypeDto),
      ).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return an array of transaction types', async () => {
      const types = [
        {
          name: 'Financial',
          creatorId: 1,
        },
      ];

      prismaMock.transactionType.findMany.mockResolvedValue(types);

      const result = await service.findAll();

      expect(prismaMock.transactionType.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TransactionType);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transactionType.findMany.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const name = 'Financial';

    it('should return a transaction type if found', async () => {
      const type = {
        name,
        creatorId: 1,
      };

      prismaMock.transactionType.findUnique.mockResolvedValue(type);

      const result = await service.findOne(name);

      expect(prismaMock.transactionType.findUnique).toHaveBeenCalledWith({
        where: { name },
      });
      expect(result).toBeInstanceOf(TransactionType);
    });

    it('should throw NotFoundException if transaction type not found', async () => {
      prismaMock.transactionType.findUnique.mockResolvedValue(null);

      await expect(service.findOne(name)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transactionType.findUnique.mockRejectedValue(error);

      await expect(service.findOne(name)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    const name = 'Financial';

    it('should successfully remove a transaction type', async () => {
      const deletedType = {
        name,
        creatorId: 1,
      };

      prismaMock.transactionType.delete.mockResolvedValue(deletedType);

      const result = await service.remove(name);

      expect(prismaMock.transactionType.delete).toHaveBeenCalledWith({
        where: { name },
      });
      expect(result).toBeInstanceOf(TransactionType);
    });

    it('should throw NotFoundException if transaction type not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.transactionType.delete.mockRejectedValue(error);

      await expect(service.remove(name)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.transactionType.delete.mockRejectedValue(error);

      await expect(service.remove(name)).rejects.toThrow(error);
    });
  });
});
