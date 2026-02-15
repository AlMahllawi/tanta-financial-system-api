import { Module } from '@nestjs/common';
import { TransactionForwardService } from './transaction-forward.service.js';
import { TransactionForwardController } from './transaction-forward.controller.js';

@Module({
  controllers: [TransactionForwardController],
  providers: [TransactionForwardService],
})
export class TransactionForwardModule {}
