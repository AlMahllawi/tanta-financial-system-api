import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { NotFoundException } from '@nestjs/common';
import { Document } from './entities/document.entity.js';

describe('DocumentService', () => {
  let service: DocumentService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const uploaderId = 1;
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('test content'),
    } as Express.Multer.File;

    it('should successfully create a document', async () => {
      const createdDocument = {
        id: 1,
        title: 'test.pdf',
        content: Buffer.from('test content'),
        uploaderId: 1,
        uploadedAt: new Date(),
      };

      prismaMock.document.create.mockResolvedValue(createdDocument);

      const result = await service.create(uploaderId, mockFile);

      expect(prismaMock.document.create).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Document);
      expect(result.downloadURI).toBe('/documents/1/download');
    });

    it('should throw NotFoundException if uploader not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
          meta: { field_name: 'uploaderId' },
        },
      );

      prismaMock.document.create.mockRejectedValue(error);

      await expect(service.create(uploaderId, mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.document.create.mockRejectedValue(error);

      await expect(service.create(uploaderId, mockFile)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    const uploaderId = 1;

    it('should return an array of documents', async () => {
      const documents = [
        {
          id: 1,
          title: 'test.pdf',
          content: Buffer.from('test content'),
          uploaderId: 1,
          uploadedAt: new Date(),
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(documents);

      const result = await service.findAll(uploaderId);

      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: { uploaderId },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Document);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.document.findMany.mockRejectedValue(error);

      await expect(service.findAll(uploaderId)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a document if found', async () => {
      const document = {
        id,
        title: 'test.pdf',
        content: Buffer.from('test content'),
        uploaderId: 1,
        uploadedAt: new Date(),
      };

      prismaMock.document.findUnique.mockResolvedValue(document);

      const result = await service.findOne(id);

      expect(prismaMock.document.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeInstanceOf(Document);
      expect(result.downloadURI).toBe('/documents/1/download');
    });

    it('should throw NotFoundException if document not found', async () => {
      prismaMock.document.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.document.findUnique.mockRejectedValue(error);

      await expect(service.findOne(id)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a document', async () => {
      const deletedDocument = {
        id,
        title: 'test.pdf',
        content: Buffer.from('test content'),
        uploaderId: 1,
        uploadedAt: new Date(),
      };

      prismaMock.document.delete.mockResolvedValue(deletedDocument);

      const result = await service.remove(id);

      expect(prismaMock.document.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeInstanceOf(Document);
    });

    it('should throw NotFoundException if document not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      prismaMock.document.delete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw unknown errors', async () => {
      const error = new Error('Unknown error');
      prismaMock.document.delete.mockRejectedValue(error);

      await expect(service.remove(id)).rejects.toThrow(error);
    });
  });
});
