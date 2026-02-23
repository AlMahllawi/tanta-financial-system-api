import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller.js';
import { DocumentService } from './document.service.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Document } from './entities/document.entity.js';

describe('DocumentController', () => {
  let controller: DocumentController;
  let documentService: DeepMockProxy<DocumentService>;

  beforeEach(async () => {
    documentService = mockDeep<DocumentService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: documentService,
        },
      ],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('test content'),
    } as Express.Multer.File;

    it('should successfully create a document', async () => {
      documentService.create.mockResolvedValue(new Document());
      await controller.create(1, mockFile);
      expect(documentService.create).toHaveBeenCalledWith(1, mockFile);
    });
  });

  describe('findAll', () => {
    it('should return an array of documents', async () => {
      documentService.findAll.mockResolvedValue({
        data: [new Document()],
      } as any);
      await controller.findAll(1, { page: 1, perPage: 10 });
      expect(documentService.findAll).toHaveBeenCalledWith(1, {
        page: 1,
        perPage: 10,
      });
    });
  });

  describe('findOne', () => {
    const id = 1;

    it('should return a document if found', async () => {
      documentService.findOne.mockResolvedValue(new Document());
      await controller.findOne(id);
      expect(documentService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('remove', () => {
    const id = 1;

    it('should successfully remove a document', async () => {
      documentService.remove.mockResolvedValue(new Document());
      await controller.remove(id);
      expect(documentService.remove).toHaveBeenCalledWith(id);
    });
  });
});
