import { Module } from '@nestjs/common';

import { TransactionForwardController } from './transaction-forward.controller.js';
import { TransactionForwardService } from './transaction-forward.service.js';

@Module({
  controllers: [TransactionForwardController],
  providers: [TransactionForwardService],
})
export class TransactionForwardModule {}
