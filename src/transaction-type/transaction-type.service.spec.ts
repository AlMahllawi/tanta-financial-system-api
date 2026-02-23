import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTypeService } from './transaction-type.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto.js';

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

      await service.findAll({ page: 1, perPage: 10 });

      expect(prismaMock.transactionType.findMany).toHaveBeenCalledWith({
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

    it('should successfully remove a transaction type', async () => {
      const deletedType = {
        name,
        creatorId: 1,
      };

      prismaMock.transactionType.delete.mockResolvedValue(deletedType);

      await service.remove(name);

      expect(prismaMock.transactionType.delete).toHaveBeenCalledWith({
        where: { name },
      });
    });
  });
});
