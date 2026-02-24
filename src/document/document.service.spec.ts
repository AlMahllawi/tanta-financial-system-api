import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

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

      expect(prismaMock.document['create']).toHaveBeenCalledTimes(1);
      expect(result['downloadURI']).toBe('/documents/1/download');
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
      prismaMock.document.count.mockResolvedValue(1);
      prismaMock.$transaction.mockResolvedValue([documents, 1]);

      await service.findAll(uploaderId, {
        page: 1,
        perPage: 10,
      });

      expect(prismaMock.document['findMany']).toHaveBeenCalledWith({
        where: { uploaderId },
        skip: 0,
        take: 10,
      });
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

      prismaMock.document.findUniqueOrThrow.mockResolvedValue(document);

      const result = await service.findOne(id);

      expect(prismaMock.document['findUniqueOrThrow']).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result['downloadURI']).toBe('/documents/1/download');
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

      await service.remove(id);

      expect(prismaMock.document['delete']).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
