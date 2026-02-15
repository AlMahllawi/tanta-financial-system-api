import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionForwardController } from './transaction-forward.controller.js';
import { TransactionForwardService } from './transaction-forward.service.js';
import { CreateTransactionForwardDto } from './dto/create-transaction-forward.dto.js';
import { UpdateTransactionForwardDto } from './dto/update-transaction-forward.dto.js';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { TransactionForward } from './entities/transaction-forward.entity.js';
import { TransactionForwardStatus } from '../../prisma/generated/enums.js';

describe('TransactionForwardController', () => {
  let controller: TransactionForwardController;
  let transactionForwardService: DeepMockProxy<TransactionForwardService>;

  beforeEach(async () => {
    transactionForwardService = mockDeep<TransactionForwardService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionForwardController],
      providers: [
        {
          provide: TransactionForwardService,
          useValue: transactionForwardService,
        },
      ],
    }).compile();

    controller = module.get<TransactionForwardController>(
      TransactionForwardController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const transactionId = 1;
    const createDto: CreateTransactionForwardDto = {
      receiverId: 2,
      comment: 'Please review',
    };

    it('should successfully create a transaction forward', async () => {
      transactionForwardService.create.mockResolvedValue(
        new TransactionForward(),
      );
      await controller.create(transactionId, createDto, 1);
      expect(transactionForwardService.create).toHaveBeenCalledWith(
        1,
        transactionId,
        createDto,
      );
    });
  });

  describe('findAll', () => {
    const transactionId = 1;

    it('should return an array of transaction forwards', async () => {
      transactionForwardService.findAll.mockResolvedValue([
        new TransactionForward(),
      ]);
      await controller.findAll(transactionId);
      expect(transactionForwardService.findAll).toHaveBeenCalledWith(
        transactionId,
      );
    });
  });

  describe('findOne', () => {
    const transactionId = 1;
    const id = 1;

    it('should return a transaction forward if found', async () => {
      transactionForwardService.findOne.mockResolvedValue(
        new TransactionForward(),
      );
      await controller.findOne(transactionId, id);
      expect(transactionForwardService.findOne).toHaveBeenCalledWith(
        transactionId,
        id,
      );
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
      transactionForwardService.update.mockResolvedValue(
        new TransactionForward(),
      );
      await controller.update(transactionId, id, updateDto);
      expect(transactionForwardService.update).toHaveBeenCalledWith(
        transactionId,
        id,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    const transactionId = 1;
    const id = 1;

    it('should successfully remove a transaction forward', async () => {
      transactionForwardService.remove.mockResolvedValue(
        new TransactionForward(),
      );
      await controller.remove(transactionId, id);
      expect(transactionForwardService.remove).toHaveBeenCalledWith(
        transactionId,
        id,
      );
    });
  });
});
