import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTypeService } from './transaction-type.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';
import { UserRole } from '../../prisma/generated/enums.js';

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

      await service.create(creatorId, createTransactionTypeDto);

      expect(prismaMock.transactionType.create).toHaveBeenCalledTimes(1);
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
      prismaMock.transactionType.count.mockResolvedValue(1);
      prismaMock.$transaction.mockResolvedValue([types, 1]);

      await service.findAll({ page: 1, perPage: 10, creatorId: 1 });

      expect(prismaMock.transactionType.findMany).toHaveBeenCalledWith({
        where: { creatorId: 1 },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    const name = 'Financial';

    it('should return a transaction type if found', async () => {
      const type = {
        name,
        creatorId: 1,
      };

      prismaMock.transactionType.findUniqueOrThrow.mockResolvedValue(type);

      await service.findOne(name);

      expect(prismaMock.transactionType.findUniqueOrThrow).toHaveBeenCalledWith(
        {
          where: { name },
        },
      );
    });
  });

  describe('remove', () => {
    const name = 'Financial';

    it('should successfully remove a transaction type if user is creator', async () => {
      const type = {
        name,
        creatorId: 1,
      };

      prismaMock.transactionType.findUniqueOrThrow.mockResolvedValue(type);
      prismaMock.transactionType.delete.mockResolvedValue(type);

      await service.remove(name, 1, UserRole.USER);

      expect(prismaMock.transactionType.delete).toHaveBeenCalledWith({
        where: { name },
      });
    });

    it('should successfully remove a transaction type if user is admin', async () => {
      const type = {
        name,
        creatorId: 2,
      };

      prismaMock.transactionType.findUniqueOrThrow.mockResolvedValue(type);
      prismaMock.transactionType.delete.mockResolvedValue(type);

      await service.remove(name, 1, UserRole.ADMIN);

      expect(prismaMock.transactionType.delete).toHaveBeenCalledWith({
        where: { name },
      });
    });

    it('should throw ApiException if user is not creator and not admin', async () => {
      const type = {
        name,
        creatorId: 2,
      };

      prismaMock.transactionType.findUniqueOrThrow.mockResolvedValue(type);

      await expect(service.remove(name, 1, UserRole.USER)).rejects.toThrow();
    });
  });
});
