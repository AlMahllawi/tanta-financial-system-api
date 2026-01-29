import { Test, TestingModule } from '@nestjs/testing';
import { TransactionForwardService } from './transaction-forward.service';

describe('TransactionForwardService', () => {
  let service: TransactionForwardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionForwardService],
    }).compile();

    service = module.get<TransactionForwardService>(TransactionForwardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
