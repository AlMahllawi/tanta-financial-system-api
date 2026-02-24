import { jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionForwardService } from './transaction-forward.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  TransactionForwardStatus,
  UserRole,
} from '../../prisma/generated/enums.js';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { ApiException } from '../common/exceptions/api.exception.js';

describe('TransactionForwardService', () => {
  let service: TransactionForwardService;
  let prismaMock: DeepMockProxy<PrismaService>;

  const mockUser = {
    id: 1,
    name: 'Test User',
    hashedPassword: 'hashed',
    departmentName: 'Test Dept',
    active: true,
    role: UserRole.USER,
    createdAt: new Date(),
    lastLogin: null,
  };

  const mockForward = {
    id: 1,
    status: TransactionForwardStatus.WAITING,
    senderComment: 'Please review',
    receiverComment: null,
    senderId: 1,
    receiverId: 2,
    senderSeen: true,
    receiverSeen: false,
    forwardedAt: new Date(),
    updatedAt: new Date(),
    transactionId: 1,
    sender: mockUser,
    receiver: { ...mockUser, id: 2, name: 'Receiver User' },
  };

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionForwardService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TransactionForwardService>(TransactionForwardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const senderId = 1;
    const transactionId = 1;
    const createDto: CreateTransactionForwardDto = {
      receiverId: 2,
      comment: 'Please review',
    };

    it('should successfully create a transaction forward', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({
        id: transactionId,
        creatorId: senderId,
      } as never);
      prismaMock.transactionForward.create.mockResolvedValue(
        mockForward as never,
      );

      await service.create(senderId, transactionId, createDto);

      expect(prismaMock.transactionForward['create']).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiException if transaction not found', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      await expect(
        service.create(senderId, transactionId, createDto),
      ).rejects.toThrow(ApiException);
    });
  });

  describe('findAll', () => {
    const transactionId = 1;

    it('should return an array of transaction forwards', async () => {
      const types = [mockForward];
      prismaMock.transactionForward.findMany.mockResolvedValue(types as never);
      prismaMock.transactionForward.count.mockResolvedValue(1);
      prismaMock.$transaction.mockResolvedValue([types, 1]);

      await service.findAll(transactionId, { page: 1, perPage: 10 });

      expect(prismaMock.transactionForward['findMany']).toHaveBeenCalledWith({
        where: { transactionId },
        include: { sender: true, receiver: true },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    const transactionId = 1;
    const id = 1;

    it('should return a transaction forward if found', async () => {
      prismaMock.transactionForward.findFirstOrThrow.mockResolvedValue(
        mockForward as never,
      );

      await service.findOne(transactionId, id);

      expect(
        prismaMock.transactionForward['findFirstOrThrow'],
      ).toHaveBeenCalledWith({
        where: { id, transactionId },
        include: { sender: true, receiver: true },
      });
    });
  });

  describe('update', () => {
    it('is skipped because no active endpoint', () => {});
  });

  describe('remove', () => {
    const transactionId = 1;
    const id = 1;

    it('should successfully remove a transaction forward', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({
        id: transactionId,
        creatorId: 1,
      } as never);
      prismaMock.transactionForward.findUnique.mockResolvedValue(
        mockForward as never,
      );
      prismaMock.transactionForward.delete.mockResolvedValue(
        mockForward as never,
      );

      await service.remove(1, transactionId, id);

      expect(prismaMock.transactionForward['delete']).toHaveBeenCalledWith({
        where: { id, transactionId },
        include: { sender: true, receiver: true },
      });
    });

    it('should throw ApiException if forward not found', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({
        id: transactionId,
        creatorId: 1,
      } as never);
      prismaMock.transactionForward.findUnique.mockResolvedValue(null);

      await expect(service.remove(1, transactionId, id)).rejects.toThrow(
        ApiException,
      );
    });
  });
});
