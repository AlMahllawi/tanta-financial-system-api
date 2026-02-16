import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransactionPriority } from '../../prisma/generated/enums.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';

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

  const mockDate = new Date();
  const transactionWithDocs = {
    id: 1,
    title: 'Test Transaction',
    description: 'Test Description',
    typeName: 'Financial',
    fulfilled: false,
    priority: TransactionPriority.MEDIUM,
    creatorId: 1,
    createdAt: mockDate,
    updatedAt: mockDate,
    documents: [
      {
        transactionId: 1,
        documentId: 100,
        attachedBy: 1,
        attachedAt: mockDate,
        document: {
          id: 100,
          title: 'Test Doc',
          description: 'Desc',
          filePath: '/path/to/doc',
          fileType: 'pdf',
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      },
    ],
  };

  describe('create', () => {
    const creatorId = 1;
    const createTransactionDto: CreateTransactionDto = {
      title: 'Test Transaction',
      description: 'Test Description',
      typeName: 'Financial',
      priority: TransactionPriority.MEDIUM,
      documentsIds: [100],
    };

    it('should successfully create a transaction and transform result', async () => {
      prismaMock.transaction.create.mockResolvedValue(
        transactionWithDocs as any,
      );

      const result = await service.create(creatorId, createTransactionDto);

      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: {
          title: createTransactionDto.title,
          description: createTransactionDto.description,
          typeName: createTransactionDto.typeName,
          priority: createTransactionDto.priority,
          creatorId,
          documents: {
            create: [{ documentId: 100, attachedBy: creatorId }],
          },
        },
        include: {
          documents: {
            include: {
              document: true,
            },
          },
        },
      });

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].downloadURI).toBeDefined();
      expect(result.documents[0].downloadURI).toContain(
        '/documents/100/download',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of transactions with transformed documents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        transactionWithDocs as any,
      ]);

      const result = await service.findAll();

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        include: {
          documents: {
            include: {
              document: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].documents[0].downloadURI).toBeDefined();
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a transaction if found', async () => {
      prismaMock.transaction.findUniqueOrThrow.mockResolvedValue(
        transactionWithDocs as any,
      );

      const result = await service.findOne(id);

      expect(prismaMock.transaction.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id },
        include: { documents: { include: { document: true } } },
      });
      expect(result.documents[0].downloadURI).toBeDefined();
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
        ...transactionWithDocs,
        ...updateTransactionDto,
      };
      prismaMock.transaction.update.mockResolvedValue(
        updatedTransaction as any,
      );

      await service.update(id, updateTransactionDto);

      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id },
        data: updateTransactionDto,
        include: { documents: { include: { document: true } } },
      });
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a transaction', async () => {
      prismaMock.transaction.delete.mockResolvedValue(
        transactionWithDocs as any,
      );

      await service.remove(id);

      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({
        where: { id },
        include: { documents: { include: { document: true } } },
      });
    });
  });

  describe('attachDocument', () => {
    const transactionId = 1;
    const documentId = 100;
    const userId = 1;

    it('should attach a document using upsert', async () => {
      prismaMock.transactionDocument.upsert.mockResolvedValue({} as any);
      // findOne is called after attach, so we mock findUniqueOrThrow
      prismaMock.transaction.findUniqueOrThrow.mockResolvedValue(
        transactionWithDocs as any,
      );

      await service.attachDocument(transactionId, documentId, userId);

      expect(prismaMock.transactionDocument.upsert).toHaveBeenCalledWith({
        where: {
          transactionId_documentId: {
            transactionId,
            documentId,
          },
        },
        create: {
          transactionId,
          documentId,
          attachedBy: userId,
        },
        update: {},
      });

      expect(prismaMock.transaction.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: { documents: { include: { document: true } } },
      });
    });
  });

  describe('detachDocument', () => {
    const transactionId = 1;
    const documentId = 100;

    it('should detach a document using deleteMany', async () => {
      prismaMock.transactionDocument.deleteMany.mockResolvedValue({ count: 1 });
      // findOne is called after detach
      prismaMock.transaction.findUniqueOrThrow.mockResolvedValue(
        transactionWithDocs as any,
      );

      await service.detachDocument(transactionId, documentId);

      expect(prismaMock.transactionDocument.deleteMany).toHaveBeenCalledWith({
        where: {
          transactionId,
          documentId,
        },
      });

      expect(prismaMock.transaction.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: { documents: { include: { document: true } } },
      });
    });
  });
});
