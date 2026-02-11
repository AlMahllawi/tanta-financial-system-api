import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service.js';
import { TransactionForwardService } from './transaction-forward.service.js';

describe('TransactionForwardService', () => {
  let service: TransactionForwardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionForwardService,
        {
          provide: UserService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TransactionForwardService>(TransactionForwardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
