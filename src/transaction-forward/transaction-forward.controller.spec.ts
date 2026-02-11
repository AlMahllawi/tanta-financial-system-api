import { Test, TestingModule } from '@nestjs/testing';
import { TransactionForwardController } from './transaction-forward.controller.js';
import { TransactionForwardService } from './transaction-forward.service.js';

describe('TransactionForwardController', () => {
  let controller: TransactionForwardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionForwardController],
      providers: [
        {
          provide: TransactionForwardService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TransactionForwardController>(
      TransactionForwardController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
