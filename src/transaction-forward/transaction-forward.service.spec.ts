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
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';

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
      prismaMock.transactionForward.create.mockResolvedValue(
        mockForward as any,
      );

      await service.create(senderId, transactionId, createDto);

      expect(prismaMock.transactionForward.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    const transactionId = 1;

    it('should return an array of transaction forwards', async () => {
      prismaMock.transactionForward.findMany.mockResolvedValue([
        mockForward,
      ] as any);

      await service.findAll(transactionId);

      expect(prismaMock.transactionForward.findMany).toHaveBeenCalledWith({
        where: { transactionId },
        include: { sender: true, receiver: true },
      });
    });
  });

  describe('findOne', () => {
    const transactionId = 1;
    const id = 1;

    it('should return a transaction forward if found', async () => {
      prismaMock.transactionForward.findFirstOrThrow.mockResolvedValue(
        mockForward as any,
      );

      await service.findOne(transactionId, id);

      expect(
        prismaMock.transactionForward.findFirstOrThrow,
      ).toHaveBeenCalledWith({
        where: { id, transactionId },
        include: { sender: true, receiver: true },
      });
    });
  });

  describe('update', () => {
    const transactionId = 1;
    const id = 1;
    const updateDto: UpdateTransactionForwardDto = {
      status: TransactionForwardStatus.APPROVED,
      comment: 'Looks good',
    };

    it('should successfully update a transaction forward', async () => {
      prismaMock.transactionForward.findFirst.mockResolvedValue(
        mockForward as any,
      );
      prismaMock.transactionForward.update.mockResolvedValue({
        ...mockForward,
        status: TransactionForwardStatus.APPROVED,
        receiverComment: 'Looks good',
        receiverSeen: true,
      } as any);

      await service.update(transactionId, id, updateDto);

      expect(prismaMock.transactionForward.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    const transactionId = 1;
    const id = 1;

    it('should successfully remove a transaction forward', async () => {
      prismaMock.transactionForward.delete.mockResolvedValue(
        mockForward as any,
      );

      await service.remove(transactionId, id);

      expect(prismaMock.transactionForward.delete).toHaveBeenCalledWith({
        where: { id, transactionId },
        include: { sender: true, receiver: true },
      });
    });
  });
});
